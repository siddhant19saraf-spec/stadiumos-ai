"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { logger } from "@/lib/logger";

const errorLogger = logger.child("error-boundary");

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  module?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    errorLogger.error("Component error caught", {
      error: error.message,
      module: this.props.module,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card role="alert" aria-live="assertive" className="mx-auto my-8 max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
              <CardTitle>Something went wrong</CardTitle>
            </div>
            <CardDescription id="error-description">
              {this.props.module
                ? `The ${this.props.module} module encountered an error.`
                : "An unexpected error occurred."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message ?? "No additional details available."}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={this.handleReset} variant="outline" aria-label="Retry loading the module">
              Try again
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}
