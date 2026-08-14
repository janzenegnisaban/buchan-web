delete from public.jobs;
insert into public.site_settings (key, value) values ('company', '{"name":"Buchan Global Services Corporation","shortName":"BGSC","tagline":"Customer satisfaction thru competent human resources","established":"April 2010","facebook":"https://www.facebook.com/BuchanGlobalServicesCorporation","website":"https://buchanglobal.yolasite.com","hiringAreas":"SBMA / Zambales / Bataan / Clark","branches":[{"id":"subic","name":"Subic Branch","address":"RM. 208, 2/F Sancheon Corp. Bldg., Greenwoods Park, Central Business District, Subic Bay Freeport Zone","phones":["047-603-1583","047-222-9095"],"email":"buchan_recruitment@yahoo.com"},{"id":"clark","name":"Clark Branch","address":"Office Center 05-F2, Jose Abad Santos Ave., Clark Freeport Zone, Pampanga","phones":["(045)-599-3928","0927-773-4249"],"email":"buchanglobal.clark@gmail.com"}]}'::jsonb), ('document_types', '[{"key":"resume","label":"Resume / CV","required":true},{"key":"photo_2x2","label":"2x2 ID Photo","required":true},{"key":"psa_birth","label":"PSA Birth Certificate","required":true},{"key":"nbi","label":"NBI / Police Clearance","required":true},{"key":"sss","label":"SSS ID or E-1","required":false},{"key":"philhealth","label":"PhilHealth ID / MDR","required":false},{"key":"pagibig","label":"Pag-IBIG ID / MID","required":false},{"key":"tin","label":"TIN ID / BIR Form","required":false},{"key":"diploma","label":"Diploma / TOR","required":false},{"key":"coe","label":"Certificate of Employment","required":false}]'::jsonb) on conflict (key) do update set value = excluded.value, updated_at = now();
insert into public.jobs (
      id, title, category, location, branch, employment_type, status, salary_range,
      description, qualifications, requirements, urgent, created_at, updated_at
    ) values (
      'job-barista-subic',
      'Barista',
      'Food & Beverage',
      'SBMA / Zambales',
      'subic',
      'Full-time',
      'open',
      '',
      'We''re hiring Baristas for SBMA / Zambales. Be a part of our team — apply now through the Buchan applicant portal.',
      '["6 months – 1 year of proven experience as a Barista","Applicants without experience are welcome (must be willing to undergo training)","Willingness to work full-time and in shifting schedules","Pleasing personality and strong customer service skills","Ability to work efficiently in a fast-paced environment under pressure"]'::jsonb,
      '["Updated resume","2x2 photo","Valid government IDs"]'::jsonb,
      true,
      '2026-03-01T08:00:00.000Z',
      '2026-03-01T08:00:00.000Z'
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
      'job-barista-clark',
      'Barista',
      'Food & Beverage',
      'Clark Freeport Zone, Pampanga',
      'clark',
      'Full-time',
      'open',
      '',
      'We''re hiring Baristas at Clark Freeport Zone, Pampanga. Apply online and upload your documents with Buchan Global Services Corp.',
      '["Female / Male","Amenable to shifting schedule","Preferably with experience"]'::jsonb,
      '["Updated resume","2x2 photo","Valid government IDs"]'::jsonb,
      true,
      '2026-03-01T08:05:00.000Z',
      '2026-03-01T08:05:00.000Z'
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
      'job-service-crew-clark',
      'Service Crew',
      'Food & Beverage',
      'Clark Freeport Zone, Pampanga',
      'clark',
      'Full-time',
      'open',
      '',
      'We''re hiring Service Crew for Clark Freeport Zone. Join our F&B deployment team.',
      '["Male","Amenable to shifting schedule","Preferably with work experience in the food and beverage industry"]'::jsonb,
      '["Updated resume","2x2 photo","Valid government IDs"]'::jsonb,
      true,
      '2026-03-01T08:10:00.000Z',
      '2026-03-01T08:10:00.000Z'
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
      'job-service-crew-subic',
      'Service Crew',
      'Food & Beverage',
      'SBMA / Zambales',
      'subic',
      'Full-time',
      'open',
      '',
      'We''re hiring Service Crew for SBMA / Zambales. Experience in food service or hospitality is an advantage.',
      '["Experience in food service or hospitality is an advantage","Knowledgeable in cleaning, sanitation, and maintenance procedures","Physically fit and able to perform general utility tasks","Hardworking, reliable, and able to work with minimal supervision"]'::jsonb,
      '["Updated resume","2x2 photo","Valid government IDs"]'::jsonb,
      true,
      '2026-03-01T08:15:00.000Z',
      '2026-03-01T08:15:00.000Z'
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
      'job-production-operators',
      'Production Operators',
      'Production',
      'SBMA / Zambales',
      'subic',
      'Contractual',
      'open',
      '',
      'We''re hiring Production Operators for SBMA / Zambales. With or without experience — apply online today.',
      '["Female / Male","At least Junior / Senior High School graduate","With or without experience","Amenable to shifting schedule","Willing to work overtime"]'::jsonb,
      '["Updated resume","2x2 photo","Valid government IDs"]'::jsonb,
      true,
      '2026-03-01T08:20:00.000Z',
      '2026-03-01T08:20:00.000Z'
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
      'job-skilled-sewer',
      'Skilled Sewer',
      'Garments',
      'SBMA / Zambales',
      'subic',
      'Contractual',
      'open',
      '',
      'We''re hiring Skilled Sewers for SBMA / Zambales. Preferably with experience in sewing works.',
      '["Female / Male","At least a High School graduate","Preferably has experience in sewing works","Willing to work overtime","Amenable to shifting schedule"]'::jsonb,
      '["Updated resume","2x2 photo","Valid government IDs"]'::jsonb,
      true,
      '2026-03-01T08:25:00.000Z',
      '2026-03-01T08:25:00.000Z'
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
      'job-hr-coordinator',
      'HR Coordinator',
      'Office / HR',
      'SBMA / Zambales / Clark',
      'subic',
      'Full-time',
      'open',
      '',
      'We''re hiring an HR Coordinator. Fresh graduates are welcome. Apply through our online portal.',
      '["Female","Has Bachelor''s Degree in Human Resource or any related course","Fresh graduates are welcome","Excellent written and verbal communication skills","Works well under pressure","Strong decision making and problem solving skills","Amenable to shifting schedule","Computer literate with capability in email, MS Office and Excel","Willing to work overtime"]'::jsonb,
      '["Updated resume","2x2 photo","Diploma / TOR","Valid government IDs"]'::jsonb,
      true,
      '2026-03-01T08:30:00.000Z',
      '2026-03-01T08:30:00.000Z'
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
      'job-qc-support',
      'Quality Control Support Personnel',
      'Quality Control',
      'SBMA / Zambales',
      'subic',
      'Contractual',
      'open',
      '',
      'We''re hiring Quality Control Support Personnel for SBMA / Zambales.',
      '["Has at least Undergraduate coursework","Preferably with training in Technical Documentation Skills","Knowledgeable in Microsoft Office","Amenable to shifting schedule"]'::jsonb,
      '["Updated resume","2x2 photo","Valid government IDs"]'::jsonb,
      true,
      '2026-03-01T08:35:00.000Z',
      '2026-03-01T08:35:00.000Z'
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