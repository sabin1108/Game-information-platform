alter type public.store_code add value if not exists 'itad';

drop trigger if exists games_set_updated_at on public.games;
create trigger games_set_updated_at
before update on public.games
for each row execute function public.set_updated_at();

drop trigger if exists game_store_products_set_updated_at on public.game_store_products;
create trigger game_store_products_set_updated_at
before update on public.game_store_products
for each row execute function public.set_updated_at();
