'use client';

import Link from 'next/link';
import {
  AdminNavigationGroup,
  AdminNavigationNode,
  AdminNavigationRoute,
  AdminRouteId,
} from '@/app/dashboard/@admin/_components/admin-navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function AdminNavigationMenu({
  navigation,
  activeRouteId,
  onNavigate,
}: {
  navigation: AdminNavigationNode[];
  activeRouteId?: AdminRouteId;
  onNavigate?: () => void;
}) {
  return (
    <ScrollArea className='h-full'>
      <div className='space-y-6 p-4'>
        {navigation.map(node => (
          <AdminNavigationNodeItem
            key={node.id}
            node={node}
            activeRouteId={activeRouteId}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

type NavigationNodeItemProps = {
  node: AdminNavigationNode;
  activeRouteId?: AdminRouteId;
  onNavigate?: () => void;
};

function AdminNavigationNodeItem({ node, activeRouteId, onNavigate }: NavigationNodeItemProps) {
  if (node.type === 'divider') {
    return <div className='border-border/60 mx-4 border-t' />;
  }

  if (node.type === 'group') {
    return <AdminNavigationGroupBlock node={node} activeRouteId={activeRouteId} onNavigate={onNavigate} />;
  }

  return (
    <AdminNavigationLink node={node} isActive={node.id === activeRouteId} onNavigate={onNavigate} />
  );
}

function AdminNavigationGroupBlock({
  node,
  activeRouteId,
  onNavigate,
}: {
  node: AdminNavigationGroup;
  activeRouteId?: AdminRouteId;
  onNavigate?: () => void;
}) {
  return (
    <div className='space-y-3'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
          {node.icon && <node.icon className='h-4 w-4' />}
          <span>{node.title}</span>
        </div>
        {node.description && <p className='text-muted-foreground text-xs'>{node.description}</p>}
      </div>
      <div className='space-y-1'>
        {node.children.map(child => (
          <AdminNavigationNodeItem
            key={child.id}
            node={child}
            activeRouteId={activeRouteId}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

function AdminNavigationLink({
  node,
  isActive,
  onNavigate,
}: {
  node: AdminNavigationRoute;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={node.href}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
        isActive
          ? 'bg-primary/10 text-primary shadow-sm hover:bg-primary/15'
          : 'text-foreground'
      )}
      onClick={onNavigate}
    >
      <node.icon className='h-4 w-4' />
      <span>{node.title}</span>
    </Link>
  );
}
