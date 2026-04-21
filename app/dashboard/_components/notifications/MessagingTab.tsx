'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bell,
  ChevronRight,
  Cloud,
  Copy,
  MailCheck,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  Settings,
  Smile,
} from 'lucide-react';
import {
  alertResources,
  certificateResources,
  chatMessages,
  fundingResources,
  messagePreviews,
} from './data';
import type { ChatMessage, MessagePreview, ResourceItem } from './types';

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

function MessageListItem({ message }: { message: MessagePreview }) {
  return (
    <button
      type='button'
      className={`grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${message.isActive ? 'bg-muted' : 'bg-background'
        }`}
    >
      {message.avatar ? (
        <Avatar className='h-10 w-10'>
          <AvatarImage src={message.avatar} alt={message.name} />
          <AvatarFallback>{getInitials(message.name)}</AvatarFallback>
        </Avatar>
      ) : (
        <span className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white'>
          <Cloud className='h-5 w-5' />
        </span>
      )}

      <span className='min-w-0'>
        <span className='flex items-center gap-2'>
          <span className='truncate text-[15px] font-semibold text-foreground sm:text-sm'>
            {message.name}
          </span>
          {message.unreadCount ? (
            <span className='rounded-sm bg-destructive px-1.5 py-0.5 text-[11px] font-semibold text-white'>
              {message.unreadCount}
            </span>
          ) : null}
        </span>

        <span className='mt-1 block truncate text-[13px] text-muted-foreground sm:text-xs'>
          {message.preview}
        </span>

        <span className='mt-1 block truncate text-[11px] text-muted-foreground'>
          {message.meta}
        </span>
      </span>

      <span className='flex items-center gap-1 text-[12px] text-muted-foreground'>
        {message.time}
        <ChevronRight className='h-3 w-3' />
      </span>
    </button>
  );
}

function JobPreviewCard({ message }: { message: ChatMessage }) {
  if (!message.jobCard) return null;

  return (
    <div className='mt-3 grid gap-3 border border-border bg-muted p-3 sm:grid-cols-[132px_minmax(0,1fr)_auto]'>
      <div className='flex h-[72px] items-end bg-muted px-3 pb-2'>
        <span className='h-7 w-4 bg-primary/40' />
        <span className='ml-1 h-10 w-4 bg-primary/60' />
        <span className='ml-1 h-14 w-4 bg-primary' />
        <span className='ml-2 h-px flex-1 bg-border' />
      </div>

      <div className='min-w-0'>
        <h4 className='truncate text-base font-semibold text-foreground sm:text-[15px]'>
          {message.jobCard.title}
        </h4>

        <p className='mt-1 truncate text-sm text-muted-foreground sm:text-xs'>
          {message.jobCard.company}
        </p>

        <p className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground'>
          <span>{message.jobCard.mode}</span>
          <span>{message.jobCard.role}</span>
          <span>{message.jobCard.skills}</span>
        </p>

        <span className='mt-2 inline-flex bg-muted px-2 py-1 text-xs text-muted-foreground'>
          {message.jobCard.pay}
        </span>
      </div>

      <Button className='h-9 self-end bg-primary px-5 text-sm text-white hover:bg-primary/90'>
        View Job
        <ChevronRight className='ml-1 h-4 w-4' />
      </Button>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <article className='grid grid-cols-[40px_minmax(0,1fr)] gap-3 px-4 py-2 sm:grid-cols-[44px_minmax(0,1fr)] sm:px-5'>
      <Avatar className='h-9 w-9 sm:h-10 sm:w-10'>
        <AvatarImage src={message.avatar} alt={message.sender} />
        <AvatarFallback>{getInitials(message.sender)}</AvatarFallback>
      </Avatar>

      <div className='min-w-0'>
        <div className='mb-1 flex flex-wrap items-center gap-2'>
          <h3 className='text-foreground text-[17px] font-semibold sm:text-base'>
            {message.sender}
          </h3>

          {message.time ? (
            <span className='bg-muted px-2 py-1 text-xs text-muted-foreground'>
              {message.time}
            </span>
          ) : null}
        </div>

        <p className='max-w-[760px] text-[15px] leading-7 text-foreground sm:text-[17px] md:text-[18px] xl:text-[17px]'>
          {message.content}
        </p>

        <JobPreviewCard message={message} />
      </div>
    </article>
  );
}

function ResourcePanel({
  title,
  items,
  tabs,
}: {
  title: string;
  items: ResourceItem[];
  tabs?: string[];
}) {
  return (
    <section className='border border-border bg-background p-4'>
      <h2 className='mb-3 text-lg font-semibold text-foreground sm:text-xl'>
        {title}
      </h2>

      {tabs ? (
        <div className='mb-3 grid grid-cols-3 border border-border text-center text-sm text-muted-foreground'>
          {tabs.map((tab, index) => (
            <button
              key={tab}
              type='button'
              className={`px-2 py-3 transition-colors hover:bg-muted ${index === 0 ? 'bg-muted text-foreground' : ''
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      ) : null}

      <div className='space-y-3'>
        {items.map(item => {
          const Icon = item.icon;

          return (
            <div key={item.id} className='grid grid-cols-[36px_minmax(0,1fr)_auto] gap-3'>
              <span className='flex h-7 w-7 items-center justify-center bg-muted text-primary'>
                <Icon className='h-4 w-4' />
              </span>

              <span className='min-w-0'>
                <span className='block truncate text-[15px] font-medium text-foreground'>
                  {item.title}
                </span>
                <span className='block truncate text-xs text-muted-foreground'>
                  {item.subtitle}
                </span>
              </span>

              <Button
                variant='outline'
                className='h-8 border-border px-3 text-xs text-primary hover:bg-muted'
              >
                {item.action}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function MessagingTab() {
  return (
    <section className='bg-background'>
      <div className='grid min-h-[620px] border border-border bg-background xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(520px,1fr)_320px]'>
        {/* Sidebar */}
        <aside className='border-b border-border bg-background xl:border-r xl:border-b-0'>
          <div className='flex items-center justify-between border-b border-border px-4 py-4'>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Bell className='h-4 w-4' />
              <h2 className='text-base font-medium text-foreground'>
                Messages (6)
              </h2>
            </div>
            <Settings className='h-4 w-4 text-muted-foreground' />
          </div>

          <label className='relative block border-b border-border'>
            <Search className='absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              aria-label='Search messages'
              placeholder='Search messages...'
              className='h-12 border-0 pl-11 shadow-none focus-visible:ring-0'
            />
          </label>

          <div>
            {messagePreviews.map(message => (
              <MessageListItem key={message.id} message={message} />
            ))}
          </div>

          <button
            type='button'
            className='flex w-full items-center justify-center gap-1 px-4 py-4 text-sm font-medium text-primary hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
          >
            See All Messages
            <ChevronRight className='h-4 w-4' />
          </button>
        </aside>

        {/* Chat */}
        <main className='min-w-0 border-b border-border bg-background 2xl:border-r 2xl:border-b-0'>
          <header className='flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5'>
            <div className='flex min-w-0 items-center gap-3'>
              <Avatar className='h-11 w-11'>
                <AvatarImage src='https://i.pravatar.cc/120?img=47' alt='Sarah Johnson' />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>

              <div className='min-w-0'>
                <h2 className='truncate text-base font-semibold text-foreground sm:text-lg'>
                  Sarah Johnson
                </h2>
                <p className='truncate text-xs text-muted-foreground sm:text-sm'>
                  Instructor - CreativeMinds Academy
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3 text-muted-foreground'>
              <MailCheck className='h-5 w-5' />
              <RefreshCw className='h-5 w-5' />
              <Copy className='h-5 w-5' />
              <Settings className='h-5 w-5' />
            </div>
          </header>

          <div className='space-y-3 py-4'>
            {chatMessages.map(message => (
              <ChatBubble key={message.id} message={message} />
            ))}
          </div>

          <div className='border-t border-border px-4 py-3 sm:px-5'>
            <div className='grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2'>
              <Smile className='h-5 w-5 text-muted-foreground' />

              <Input
                aria-label='Type a message'
                placeholder='Type a message...'
                className='h-10 border-0 bg-background shadow-none focus-visible:ring-0'
              />

              <Paperclip className='h-5 w-5 text-muted-foreground' />

              <Button className='h-10 bg-primary px-5 text-white hover:bg-primary/90'>
                Send
                <Send className='ml-2 h-4 w-4' />
              </Button>
            </div>
          </div>
        </main>

        {/* Right panel */}
        <aside className='grid gap-5 bg-background p-4 xl:grid-cols-2 2xl:block 2xl:space-y-5'>
          <ResourcePanel
            title='Alerts & Reminders'
            tabs={['All', 'Alerts (2)', 'Reminders (3)']}
            items={alertResources}
          />
          <ResourcePanel title='Top Funding Resources' items={fundingResources} />
          <ResourcePanel title='Earned Certificates & Badges' items={certificateResources} />

          <section className='hidden border border-border bg-background p-3 2xl:block'>
            <Button className='h-10 w-full bg-primary text-white hover:bg-primary/90'>
              View Report
              <ChevronRight className='ml-1 h-4 w-4' />
            </Button>
          </section>
        </aside>
      </div>
    </section>
  );
}