-- Group 1: PISA
UPDATE articles SET translation_id = 'a1111111-1111-1111-1111-111111111111' WHERE id IN (1, 6, 12, 20, 21);

-- Group 2: Hairdresser / Results
UPDATE articles SET translation_id = 'b2222222-2222-2222-2222-222222222222' WHERE id IN (2, 7, 11, 19, 22);

-- Group 3: Pruning / Neuroplasticity
-- Including PL:16 based on "Neuro" context, though title differs
UPDATE articles SET translation_id = 'c3333333-3333-3333-3333-333333333333' WHERE id IN (3, 8, 13, 16, 23);

-- Group 4: ADHD / Active Child
UPDATE articles SET translation_id = 'd4444444-4444-4444-4444-444444444444' WHERE id IN (4, 9, 24);

-- Group 5: Gadgets / Attention
UPDATE articles SET translation_id = 'e5555555-5555-5555-5555-555555555555' WHERE id IN (10, 14, 17);

-- Standalone articles (unique topics) left with NULL translation_id
-- UA:5 (War), CZ:25 (Integration), PL:18 (School readiness), EN:15 (STEM)
