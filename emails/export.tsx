import * as React from 'react';
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { render, toPlainText } from 'react-email';
import { AccountCreatedEmail } from './templates/AccountCreatedEmail';

type EmailTemplateExport = {
  filename: string;
  component: React.ReactElement;
};

const templates: EmailTemplateExport[] = [
  {
    filename: 'account-created',
    component: <AccountCreatedEmail />,
  },
];

async function pathExists(candidate: string) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function resolveBackendDir() {
  const candidates = [
    process.env.ELIMIKA_BACKEND_DIR,
    path.resolve(process.cwd(), '../elimika'),
    path.resolve(process.cwd(), '../../IdeaProjects/elimika'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (await pathExists(path.join(candidate, 'src/main/resources/templates/email'))) {
      return candidate;
    }
  }

  throw new Error(
    'Could not locate the Elimika backend. Set ELIMIKA_BACKEND_DIR to the backend checkout path.'
  );
}

async function exportTemplates() {
  const backendDir = await resolveBackendDir();
  const templateDir = path.join(backendDir, 'src/main/resources/templates/email');
  await mkdir(templateDir, { recursive: true });

  for (const template of templates) {
    const renderedHtml = await render(template.component, { pretty: true });
    const html = renderedHtml.replaceAll('&#x27;', "'");
    const text = toPlainText(html);

    await writeFile(path.join(templateDir, `${template.filename}.html`), `${html}\n`, 'utf8');
    await writeFile(path.join(templateDir, `${template.filename}.txt`), `${text}\n`, 'utf8');
  }
}

exportTemplates().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
