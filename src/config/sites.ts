import { AuditSite } from "../types/routing";

/**
 * Hardcoded starter devtools startups to be audited.
 */
export const STARTUP_SITES: AuditSite[] = [
  {
    id: "browserbase",
    name: "Browserbase",
    homepageUrl: "https://www.browserbase.com",
    docsRootUrl: "https://docs.browserbase.com/introduction/getting-started",
  },
  {
    id: "firecrawl",
    name: "Firecrawl",
    homepageUrl: "https://www.firecrawl.dev",
    docsRootUrl: "https://docs.firecrawl.dev/introduction",
  },
  {
    id: "supabase",
    name: "Supabase",
    homepageUrl: "https://supabase.com",
    docsRootUrl: "https://supabase.com/docs/guides/getting-started",
  },
  {
    id: "pinecone",
    name: "Pinecone",
    homepageUrl: "https://www.pinecone.io",
    docsRootUrl: "https://docs.pinecone.io/guides/get-started/quickstart",
  },
  {
    id: "modal",
    name: "Modal",
    homepageUrl: "https://modal.com",
    docsRootUrl: "https://modal.com/docs/guide",
  },
  {
    id: "replicate",
    name: "Replicate",
    homepageUrl: "https://replicate.com",
    docsRootUrl: "https://replicate.com/docs/",
  },
];
