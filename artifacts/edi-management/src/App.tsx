import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Partners from "@/pages/partners";
import Endpoints from "@/pages/endpoints";
import Documents from "@/pages/documents";
import DocumentDetail from "@/pages/document-detail";
import Validation from "@/pages/validation";
import TranslationLogs from "@/pages/translation-logs";
import Notifications from "@/pages/notifications";
import As2Settings from "@/pages/as2-settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/partners" component={Partners} />
        <Route path="/endpoints" component={Endpoints} />
        <Route path="/documents" component={Documents} />
        <Route path="/documents/:id" component={DocumentDetail} />
        <Route path="/validation" component={Validation} />
        <Route path="/translation-logs" component={TranslationLogs} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/as2-settings" component={As2Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
