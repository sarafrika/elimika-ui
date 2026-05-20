'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function SupportContactForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setLoading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData(event.currentTarget);

        const payload = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
        };

        try {
            const response = await fetch('/api/support', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            setSuccess(true);
            event.currentTarget.reset();
        } catch (err) {
            setError('Unable to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
                <Input
                    name='name'
                    placeholder='Your name'
                    required
                />

                <Input
                    name='email'
                    type='email'
                    placeholder='Your email'
                    required
                />
            </div>

            <Input
                name='subject'
                placeholder='Subject'
                required
            />

            <Textarea
                name='message'
                placeholder='Describe your issue or question'
                className='min-h-[140px]'
                required
            />

            <Button
                type='submit'
                disabled={loading}
                className='w-full sm:w-auto'
            >
                {loading ? 'Sending...' : 'Send message'}
            </Button>

            {success && (
                <p className='text-sm text-green-600'>
                    Your message has been sent successfully.
                </p>
            )}

            {error && (
                <p className='text-sm text-red-600'>
                    {error}
                </p>
            )}
        </form>
    );
}