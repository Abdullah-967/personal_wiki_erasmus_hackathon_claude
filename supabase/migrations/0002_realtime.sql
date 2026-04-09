-- Enable Realtime for wiki_pages and page_links
alter publication supabase_realtime add table wiki_pages;
alter publication supabase_realtime add table page_links;
