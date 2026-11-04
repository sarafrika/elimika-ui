import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canMove,
  canWithdrawFrom,
  movableSources,
  moveProblem,
  moveTargets,
  purseBalances,
  purseFigures,
  purseForDomain,
  purseLabel,
  type WalletWithPurses,
} from './purses';

const WALLET: WalletWithPurses = {
  currency_code: 'KES',
  balance_amount: 45000,
  held_amount: 2000,
  available_amount: 43000,
  account_balance: 47000,
  can_withdraw: true,
  purses: [
    { purse: 'COURSE_CREATOR', balance_amount: 13500, held_amount: 0, available_amount: 13500, account_balance: 13500,
      shares_total: 15000, platform_fees_total: 1500, sales_count: 1 },
    { purse: 'INSTRUCTOR', balance_amount: 30000, held_amount: 2000, available_amount: 28000, account_balance: 32000 },
    { purse: 'STUDENT', balance_amount: 1500, held_amount: 0, available_amount: 1500, account_balance: 1500 },
  ],
};

test('each role dashboard shows its own purse', () => {
  assert.equal(purseForDomain('course_creator'), 'COURSE_CREATOR');
  assert.equal(purseForDomain('instructor'), 'INSTRUCTOR');
  assert.equal(purseForDomain('student'), 'STUDENT');
  assert.equal(purseForDomain('organisation_user'), 'EARNINGS');
  assert.equal(purseForDomain('organisation'), 'EARNINGS');
  assert.equal(purseForDomain('admin'), null);
  assert.equal(purseForDomain(undefined), null);
  assert.equal(purseLabel('INSTRUCTOR'), 'Instructor purse');
  assert.equal(purseLabel('SOMETHING'), null);
});

test('a purse reads its own figures, not the wallet totals', () => {
  const creator = purseFigures(WALLET, 'COURSE_CREATOR');
  assert.equal(creator?.account, 13500);
  assert.equal(creator?.available, 13500);
  assert.equal(creator?.shares, 15000);
  assert.equal(creator?.fees, 1500);
  assert.equal(creator?.canWithdraw, true);
  const instructor = purseFigures(WALLET, 'INSTRUCTOR');
  assert.deepEqual([instructor?.account, instructor?.available, instructor?.held], [32000, 28000, 2000]);
});

test('the student purse is never withdrawable, whatever the server says about the wallet', () => {
  assert.equal(canWithdrawFrom('STUDENT'), false);
  assert.equal(canWithdrawFrom('INSTRUCTOR'), true);
  assert.equal(purseFigures(WALLET, 'STUDENT')?.canWithdraw, false);
});

test('a wallet read before purses existed stands in for the purse', () => {
  const legacy = { currency_code: 'KES', balance_amount: 31500, held_amount: 500, can_withdraw: true };
  const figures = purseFigures(legacy, 'INSTRUCTOR');
  assert.equal(figures?.account, 32000);
  assert.equal(figures?.available, 31500);
  assert.equal(purseFigures(null, 'INSTRUCTOR'), null);
});

test('a purse the wallet does not list yet reads as empty', () => {
  const figures = purseFigures({ ...WALLET, purses: [] }, 'COURSE_CREATOR');
  assert.equal(figures?.account, 0);
  assert.equal(figures?.available, 0);
});

test('the wallet menu lists each purse and their total', () => {
  const all = purseBalances(WALLET);
  assert.equal(all.total, 47000);
  assert.deepEqual(all.purses.map(p => [p.label, p.account]), [
    ['Course creator purse', 13500],
    ['Instructor purse', 32000],
    ['Student purse', 1500],
  ]);
});

test('money moves out of an earning purse into any other own purse, never out of Student', () => {
  assert.equal(canMove('INSTRUCTOR', 'STUDENT'), true);
  assert.equal(canMove('COURSE_CREATOR', 'INSTRUCTOR'), true);
  assert.equal(canMove('STUDENT', 'INSTRUCTOR'), false);
  assert.equal(canMove('INSTRUCTOR', 'INSTRUCTOR'), false);
  assert.equal(canMove('EARNINGS', 'STUDENT'), false);
  assert.deepEqual(moveTargets('INSTRUCTOR'), ['COURSE_CREATOR', 'STUDENT']);
  assert.deepEqual(moveTargets('STUDENT'), []);
  assert.deepEqual(movableSources(WALLET).map(s => s.purse), ['COURSE_CREATOR', 'INSTRUCTOR']);
});

test('a move is checked before it is sent', () => {
  assert.equal(moveProblem('INSTRUCTOR', 'STUDENT', 500, 28000), null);
  assert.match(moveProblem('STUDENT', 'INSTRUCTOR', 500, 1500) ?? '', /spent but not moved out/);
  assert.match(moveProblem('INSTRUCTOR', 'STUDENT', 0, 28000) ?? '', /above zero/);
  assert.match(moveProblem('INSTRUCTOR', 'STUDENT', 30000, 28000) ?? '', /more than this purse/);
  assert.match(moveProblem(null, 'STUDENT', 10, 10) ?? '', /Choose/);
});
