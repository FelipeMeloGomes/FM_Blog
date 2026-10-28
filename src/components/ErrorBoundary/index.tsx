import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
            <div className="space-y-3">
              <h1 className="text-5xl font-bold font-heading text-destructive">Oops!</h1>
              <p className="text-lg text-muted-foreground">
                Algo deu errado. Por favor, tente novamente.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-left">
                <p className="text-sm font-mono text-destructive break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} variant="outline" className="rounded-xl">
                Tentar novamente
              </Button>
              <Button asChild className="rounded-xl">
                <Link to="/">Voltar ao início</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

export const RouteErrorFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center bg-background px-4">
    <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold font-heading text-foreground">Página indisponível</h2>
        <p className="text-muted-foreground">
          Esta página encontrou um erro e não pode ser exibida.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  </div>
);

export const ComponentErrorFallback = ({
  onRetry,
}: {
  onRetry?: () => void;
}) => (
  <div className="p-5 border border-destructive/20 rounded-xl bg-destructive/5 text-center animate-fade-in">
    <p className="text-sm text-muted-foreground mb-3">Este componente não pôde ser carregado.</p>
    {onRetry && (
      <Button size="sm" variant="outline" onClick={onRetry} className="rounded-lg">
        Tentar novamente
      </Button>
    )}
  </div>
);
