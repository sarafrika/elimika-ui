'use client';

export const RichTextPreview = ({ html }: { html: string }) => {
  return (
    <div
      className='text-foreground [&_p]:text-foreground/80 [&_li]:text-foreground/80 [&_blockquote]:border-border [&_blockquote]:text-muted-foreground [&_a]:text-primary [&_hr]:bg-border [&_pre]:bg-muted/60 [&_pre]:border-border/70 [&_code]:bg-muted [&_code]:border-border/60 [&_img]:border-border/60 [&_th]:bg-muted [&_th]:border-border [&_td]:border-border mx-auto w-full text-[14px] leading-7 [&_*]:max-w-full [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded-md [&_code]:border [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_figure]:my-8 [&_h1]:mt-12 [&_h1]:mb-5 [&_h1]:text-[1.7rem] [&_h1]:leading-tight [&_h1]:font-bold [&_h1:first-child]:mt-0 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-[1.35rem] [&_h2]:leading-snug [&_h2]:font-bold [&_h2:first-child]:mt-0 [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-[1.15rem] [&_h3]:font-semibold [&_h4]:mt-8 [&_h4]:mb-3 [&_h4]:text-base [&_h4]:font-semibold [&_hr]:my-10 [&_hr]:h-px [&_hr]:border-0 [&_img]:my-8 [&_img]:rounded-2xl [&_img]:border [&_img]:shadow-sm [&_li]:leading-7 [&_li_p]:mt-0 [&_li:not(:first-child)]:mt-1.5 [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:leading-7 [&_p:not(:first-child)]:mt-5 [&_pre]:my-8 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:p-5 [&_pre]:text-[0.95rem] [&_pre]:leading-7 [&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:my-8 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_td]:border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6'
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
