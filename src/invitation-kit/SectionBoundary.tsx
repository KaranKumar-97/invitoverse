"use client";

import { Component, type ReactNode } from "react";
import type { SectionKey } from "@/lib/invitation/schema";

type Props = { section: SectionKey; children: ReactNode };

/**
 * Isolates each section: one broken section never blanks the whole invitation.
 * Also provides the anchor (#section-events) used by the editor preview's scrollTo.
 */
export class SectionBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[invitation] section "${this.props.section}" failed to render`, error);
  }

  render() {
    if (this.state.failed) return null;
    return (
      <div id={`section-${this.props.section}`} data-section={this.props.section}>
        {this.props.children}
      </div>
    );
  }
}
