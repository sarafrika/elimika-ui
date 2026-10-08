'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { SectionError } from './async-section';

export type SectionErrorBoundaryProps = {
  children: ReactNode;
  /** Section name used in logs. */
  name?: string;
  title?: string;
  className?: string;
  /** Extra work on retry, e.g. query.refetch. The boundary always resets itself. */
  onRetry?: () => void;
  /** When this value changes (e.g. the pathname) a caught error is cleared. */
  resetKey?: unknown;
};

type State = { error: Error | null };

/** Keeps a render crash inside one section; the shell and sibling sections keep rendering. */
export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error(`section render failed${this.props.name ? `: ${this.props.name}` : ''}`, {
      error,
      componentStack: info.componentStack,
    });
  }

  componentDidUpdate(prev: SectionErrorBoundaryProps) {
    if (this.state.error && !Object.is(prev.resetKey, this.props.resetKey)) {
      this.setState({ error: null });
    }
  }

  private retry = () => {
    this.props.onRetry?.();
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <SectionError
          title={this.props.title ?? 'This section failed to display'}
          error={this.state.error}
          onRetry={this.retry}
          className={this.props.className}
        />
      );
    }
    return this.props.children;
  }
}
