insert into public.jobs (
      id, title, category, location, branch, employment_type, status, salary_range,
      description, qualifications, requirements, urgent, created_at, updated_at
    ) values (
      'job-materials-control',
      'Materials Control Support Personnel',
      'Warehouse',
      'SBMA / Zambales',
      'subic',
      'Contractual',
      'open',
      '',
      'We''re hiring Materials Control Support Personnel for SBMA / Zambales warehouse and materials operations.',
      '["Male","At least High School graduate","Preferably has experience in warehousing","Knowledgeable in Microsoft Office","Willing to work overtime","Amenable to shifting schedule","No shocking hair color"]'::jsonb,
      '["Updated resume","2x2 photo","Valid government IDs"]'::jsonb,
      true,
      '2026-03-01T08:40:00.000Z',
      '2026-03-01T08:40:00.000Z'
    ) on conflict (id) do update set
      title = excluded.title,
      category = excluded.category,
      location = excluded.location,
      branch = excluded.branch,
      employment_type = excluded.employment_type,
      status = excluded.status,
      description = excluded.description,
      qualifications = excluded.qualifications,
      requirements = excluded.requirements,
      urgent = excluded.urgent,
      updated_at = now();
insert into public.jobs (
      id, title, category, location, branch, employment_type, status, salary_range,
      description, qualifications, requirements, urgent, created_at, updated_at
    ) values (
      'job-engineering-support',
      'Production Facilities and Design Engineering Support Personnel',
      'Engineering',
      'SBMA / Zambales',
      'subic',
      'Contractual',
      'open',
      '',
      'We''re hiring Production Facilities and Design Engineering Support Personnel for machine maintenance and troubleshooting support.',
      '["Male","Preferably a Vocational graduate or College undergraduate of any related course to machine maintenance and troubleshooting","Has at least 1 year of experience in a related position or task","Willing to work overtime","Amenable to shifting schedule"]'::jsonb,
      '["Updated resume","2x2 photo","Valid government IDs","Certificate of Employment (preferred)"]'::jsonb,
      true,
      '2026-03-01T08:45:00.000Z',
      '2026-03-01T08:45:00.000Z'
    ) on conflict (id) do update set
      title = excluded.title,
      category = excluded.category,
      location = excluded.location,
      branch = excluded.branch,
      employment_type = excluded.employment_type,
      status = excluded.status,
      description = excluded.description,
      qualifications = excluded.qualifications,
      requirements = excluded.requirements,
      urgent = excluded.urgent,
      updated_at = now();
insert into public.jobs (
      id, title, category, location, branch, employment_type, status, salary_range,
      description, qualifications, requirements, urgent, created_at, updated_at
    ) values (
      'job-kitchen-staff',
      'Kitchen Staff',
      'Food & Beverage',
      'SBMA / Zambales',
      'subic',
      'Full-time',
      'open',
      '',
      'We''re hiring Kitchen Staff for SBMA / Zambales. Must have proven experience in the same field.',
      '["Female / Male","Amenable to shifting schedule","Must have proven experience in the same field"]'::jsonb,
      '["Updated resume","2x2 photo","Valid government IDs"]'::jsonb,
      true,
      '2026-03-01T08:50:00.000Z',
      '2026-03-01T08:50:00.000Z'
    ) on conflict (id) do update set
      title = excluded.title,
      category = excluded.category,
      location = excluded.location,
      branch = excluded.branch,
      employment_type = excluded.employment_type,
      status = excluded.status,
      description = excluded.description,
      qualifications = excluded.qualifications,
      requirements = excluded.requirements,
      urgent = excluded.urgent,
      updated_at = now();
insert into public.jobs (
      id, title, category, location, branch, employment_type, status, salary_range,
      description, qualifications, requirements, urgent, created_at, updated_at
    ) values (
      'job-line-cook',
      'Line Cook',
      'Food & Beverage',
      'SBMA / Zambales',
      'subic',
      'Full-time',
      'open',
      '',
      'We''re hiring Line Cooks for SBMA / Zambales. Proven experience required.',
      '["Female / Male","Amenable to shifting schedule","Must have proven experience in the same field"]'::jsonb,
      '["Updated resume","2x2 photo","Valid government IDs"]'::jsonb,
      true,
      '2026-03-01T08:52:00.000Z',
      '2026-03-01T08:52:00.000Z'
    ) on conflict (id) do update set
      title = excluded.title,
      category = excluded.category,
      location = excluded.location,
      branch = excluded.branch,
      employment_type = excluded.employment_type,
      status = excluded.status,
      description = excluded.description,
      qualifications = excluded.qualifications,
      requirements = excluded.requirements,
      urgent = excluded.urgent,
      updated_at = now();
insert into public.jobs (
      id, title, category, location, branch, employment_type, status, salary_range,
      description, qualifications, requirements, urgent, created_at, updated_at
    ) values (
      'job-utility',
      'Utility',
      'Facilities',
      'SBMA / Zambales',
      'subic',
      'Full-time',
      'open',
      '',
      'We''re hiring Utility personnel for SBMA / Zambales.',
      '["Female / Male","Amenable to shifting schedule","Must have proven experience in the same field"]'::jsonb,
      '["Updated resume","2x2 photo","Valid government IDs"]'::jsonb,
      true,
      '2026-03-01T08:54:00.000Z',
      '2026-03-01T08:54:00.000Z'
    ) on conflict (id) do update set
      title = excluded.title,
      category = excluded.category,
      location = excluded.location,
      branch = excluded.branch,
      employment_type = excluded.employment_type,
      status = excluded.status,
      description = excluded.description,
      qualifications = excluded.qualifications,
      requirements = excluded.requirements,
      urgent = excluded.urgent,
      updated_at = now();
insert into public.jobs (
      id, title, category, location, branch, employment_type, status, salary_range,
      description, qualifications, requirements, urgent, created_at, updated_at
    ) values (
      'job-driver',
      'Driver',
      'Logistics',
      'SBMA / Zambales',
      'subic',
      'Full-time',
      'open',
      '',
      'We''re hiring Drivers for SBMA / Zambales. Must have proven experience.',
      '["Female / Male","Amenable to shifting schedule","Must have proven experience in the same field","Valid driver''s license required"]'::jsonb,
      '["Updated resume","2x2 photo","Driver''s license","Valid government IDs"]'::jsonb,
      true,
      '2026-03-01T08:56:00.000Z',
      '2026-03-01T08:56:00.000Z'
    ) on conflict (id) do update set
      title = excluded.title,
      category = excluded.category,
      location = excluded.location,
      branch = excluded.branch,
      employment_type = excluded.employment_type,
      status = excluded.status,
      description = excluded.description,
      qualifications = excluded.qualifications,
      requirements = excluded.requirements,
      urgent = excluded.urgent,
      updated_at = now();
insert into public.jobs (
      id, title, category, location, branch, employment_type, status, salary_range,
      description, qualifications, requirements, urgent, created_at, updated_at
    ) values (
      'job-janitor',
      'Janitor',
      'Facilities',
      'SBMA / Zambales',
      'subic',
      'Full-time',
      'open',
      '',
      'We''re hiring Janitors for SBMA / Zambales.',
      '["Female / Male","Amenable to shifting schedule","Must have proven experience in the same field"]'::jsonb,
      '["Updated resume","2x2 photo","Valid government IDs"]'::jsonb,
      true,
      '2026-03-01T08:58:00.000Z',
      '2026-03-01T08:58:00.000Z'
    ) on conflict (id) do update set
      title = excluded.title,
      category = excluded.category,
      location = excluded.location,
      branch = excluded.branch,
      employment_type = excluded.employment_type,
      status = excluded.status,
      description = excluded.description,
      qualifications = excluded.qualifications,
      requirements = excluded.requirements,
      urgent = excluded.urgent,
      updated_at = now();
insert into public.jobs (
      id, title, category, location, branch, employment_type, status, salary_range,
      description, qualifications, requirements, urgent, created_at, updated_at
    ) values (
      'job-junior-hairstylist',
      'Junior Hairstylist',
      'Personal Care',
      'SBMA / Zambales',
      'subic',
      'Full-time',
      'open',
      '',
      'We''re hiring Junior Hairstylists for SBMA / Zambales. Proven experience in the same field required.',
      '["Female / Male","Amenable to shifting schedule","Must have proven experience in the same field"]'::jsonb,
      '["Updated resume","2x2 photo","Valid government IDs"]'::jsonb,
      true,
      '2026-03-01T09:00:00.000Z',
      '2026-03-01T09:00:00.000Z'
    ) on conflict (id) do update set
      title = excluded.title,
      category = excluded.category,
      location = excluded.location,
      branch = excluded.branch,
      employment_type = excluded.employment_type,
      status = excluded.status,
      description = excluded.description,
      qualifications = excluded.qualifications,
      requirements = excluded.requirements,
      urgent = excluded.urgent,
      updated_at = now();