/** Blocking problems, one destructive row each. */
export function ErrorList({ messages }: { messages: string[] }) {
  return (
    <ul role='alert' className='space-y-1.5'>
      {messages.map(message => (
        <li key={message} className='bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm'>
          {message}
        </li>
      ))}
    </ul>
  );
}
