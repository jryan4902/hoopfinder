-- Placeholder courts. Edit these before launch — every field here is meant to be
-- hand-verified by someone who has actually stood on the court.
--
-- `id` is the slug that ends up in the QR sticker URL: /c/woodlawn
-- `headcount` note: nothing to seed here, check-ins come from real people.

insert into public.courts
  (id, name, area, kind, full_courts, lights, nets, surface, cost, hours, parking, lat, lng)
values
  (
    'woodlawn',
    'Woodlawn Lake Park',
    'Near West Side',
    'outdoor',
    2,
    true,
    'Chain nets, both hoops',
    'Concrete, repainted 2024',
    'Free',
    '6am - 11pm',
    'Free lot off W Mistletoe Ave',
    29.4602,
    -98.5305
  ),
  (
    'lincoln',
    'Lincoln Park',
    'East Side',
    'outdoor',
    2,
    true,
    'Nylon nets, one hoop missing a net',
    'Asphalt, some cracking at the baseline',
    'Free',
    '7am - 10pm',
    'Street parking on N Hackberry',
    29.4324,
    -98.4595
  ),
  (
    'ymca-downtown',
    'Downtown YMCA',
    'Downtown',
    'indoor',
    1,
    false,
    'New nets',
    'Hardwood',
    '$10 day pass, members free',
    'Mon-Fri 5am - 10pm, Sat-Sun 7am - 7pm',
    'Garage on N Flores, validated',
    29.4265,
    -98.4938
  )
on conflict (id) do nothing;
