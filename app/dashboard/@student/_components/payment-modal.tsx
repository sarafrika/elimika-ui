import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    Building2,
    CreditCard,
    Lock,
    Smartphone,
    Wallet,
} from 'lucide-react';
import React, { useState } from 'react';

type Props = {
    totalFee: number;
    currency: string;
    onBack: () => void;
    onPaymentComplete: (paymentMethod: string) => void;
};

export const PaymentModal: React.FC<Props> = ({
    totalFee,
    currency,
    onBack,
    onPaymentComplete,
}) => {
    const [paymentMethod, setPaymentMethod] = useState<string>('card');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Form states
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCVC, setCardCVC] = useState('');
    const [cardName, setCardName] = useState('');

    const [mPesaPhone, setMPesaPhone] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [skillFundId, setSkillFundId] = useState('');

    const handlePayment = async () => {
        if (!agreeToTerms) {
            alert('Please accept the terms and conditions');
            return;
        }

        setProcessing(true);

        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setProcessing(false);
        onPaymentComplete(paymentMethod);
    };

    const isFormValid = () => {
        if (!agreeToTerms) return false;

        switch (paymentMethod) {
            case 'card':
                return cardNumber && cardExpiry && cardCVC && cardName;
            case 'm-pesa':
                return mPesaPhone;
            case 'bank':
                return bankAccount;
            case 'skill-fund':
                return skillFundId;
            default:
                return false;
        }
    };

    return (
        <Card className="p-6 space-y-6">
            {/* Header */}
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="mb-4 -ml-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <h3>Payment</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Choose your payment method
                </p>
            </div>

            <Separator />

            {/* Amount */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">Amount to pay</p>
                <p className="text-3xl text-blue-900">
                    {currency} ${totalFee.toFixed(2)}
                </p>
            </div>

            {/* Payment Methods */}
            <div>
                <Label>Payment Method</Label>
                <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="mt-3 space-y-3"
                >
                    {/* Credit/Debit Card */}
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="payment-card" />
                        <Label
                            htmlFor="payment-card"
                            className="cursor-pointer flex items-center gap-2 flex-1"
                        >
                            <CreditCard className="w-4 h-4" />
                            Credit / Debit Card
                        </Label>
                    </div>

                    {/* M-Pesa */}
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="m-pesa" id="payment-mpesa" />
                        <Label
                            htmlFor="payment-mpesa"
                            className="cursor-pointer flex items-center gap-2 flex-1"
                        >
                            <Smartphone className="w-4 h-4" />
                            M-Pesa
                        </Label>
                    </div>

                    {/* Bank Transfer */}
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bank" id="payment-bank" />
                        <Label
                            htmlFor="payment-bank"
                            className="cursor-pointer flex items-center gap-2 flex-1"
                        >
                            <Building2 className="w-4 h-4" />
                            Bank Transfer
                        </Label>
                    </div>

                    {/* Skill Fund */}
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="skill-fund" id="payment-skillfund" />
                        <Label
                            htmlFor="payment-skillfund"
                            className="cursor-pointer flex items-center gap-2 flex-1"
                        >
                            <Wallet className="w-4 h-4" />
                            Skill Fund
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            <Separator />

            {/* Payment Form */}
            <div className="space-y-4">
                {paymentMethod === 'card' && (
                    <>
                        <div>
                            <Label>Card Number</Label>
                            <Input
                                placeholder="1234 5678 9012 3456"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                className="mt-2"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Expiry Date</Label>
                                <Input
                                    placeholder="MM/YY"
                                    value={cardExpiry}
                                    onChange={(e) => setCardExpiry(e.target.value)}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label>CVC</Label>
                                <Input
                                    placeholder="123"
                                    value={cardCVC}
                                    onChange={(e) => setCardCVC(e.target.value)}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Cardholder Name</Label>
                            <Input
                                placeholder="John Doe"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                                className="mt-2"
                            />
                        </div>
                    </>
                )}

                {paymentMethod === 'm-pesa' && (
                    <div>
                        <Label>M-Pesa Phone Number</Label>
                        <Input
                            placeholder="+254 700 000 000"
                            value={mPesaPhone}
                            onChange={(e) => setMPesaPhone(e.target.value)}
                            className="mt-2"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                            You will receive a payment prompt on your phone
                        </p>
                    </div>
                )}

                {paymentMethod === 'bank' && (
                    <div>
                        <Label>Bank Account Number</Label>
                        <Input
                            placeholder="Enter your account number"
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            className="mt-2"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                            Bank transfer details will be sent to your email
                        </p>
                    </div>
                )}

                {paymentMethod === 'skill-fund' && (
                    <div>
                        <Label>Skill Fund ID</Label>
                        <Input
                            placeholder="Enter your Skill Fund ID"
                            value={skillFundId}
                            onChange={(e) => setSkillFundId(e.target.value)}
                            className="mt-2"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                            Payment will be deducted from your Skill Fund balance
                        </p>
                    </div>
                )}
            </div>

            <Separator />

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
                <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
                    I agree to the{' '}
                    <a href="#" className="text-primary underline">
                        Terms & Conditions
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-primary underline">
                        Cancellation Policy
                    </a>
                </label>
            </div>

            {/* Payment Button */}
            <Button
                onClick={handlePayment}
                disabled={!isFormValid() || processing}
                className="w-full gap-2"
                size="lg"
            >
                <Lock className="w-4 h-4" />
                {processing ? 'Processing...' : `Pay ${currency} $${totalFee.toFixed(2)}`}
            </Button>

            {/* Security Note */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                <Lock className="w-3 h-3 mt-0.5" />
                <p>
                    Your payment information is secure and encrypted. We do not store your
                    card details on our servers.
                </p>
            </div>
        </Card>
    );
};
