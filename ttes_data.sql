--
-- PostgreSQL database dump
--

\restrict UOrX81TxHDW8AYaTQ6PJramowugRrrjeS8zhrA4FV19GS6qHwcm7q6OnfirXbLN

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, first_name, last_name, email, password, phone, enabled, created_at, updated_at) FROM stdin;
2	Jean	Dupont	jean@gmail.com	$2a$10$RBYfdYNvFeata6pf1b6ztuNDDECMLzb28I/FDxiDoS0D.O0n.Nd7a	690000000	t	2026-08-22 11:13:08.963234	2026-08-22 11:13:08.963234
3	junior	pavel	juniorpv@gmail.com	$2a$10$m9fobUK8ntqAOowYPt70sOf4owU9ksKdkUgO0frM4xCgRHA0/ZGZ6	\N	t	2026-08-24 14:33:56.136493	2026-08-24 14:33:56.136493
5	pavel	ops	jrpv@gmail.com	$2a$10$xaeE8vjDkTm/FjuaET/IM.ie6E3ahnos6KYXDXrvCaM1rxkGIORqK	+237674277897	t	2026-08-24 15:16:43.646555	2026-08-24 16:08:59.795011
4	pavel	junior	paveljr@gmail.com	$2a$10$vKiI0G0iRgSqvmN0zyCuOOAe0g7o1X/R47cwDD79Er/rU0xDR371W	+237691085447	t	2026-08-24 14:35:20.101108	2026-08-24 18:09:59.307827
6	fabrel	zeze	admin@ttesi.com	$2a$10$5do5n/52uP4tM7Xh7NMtQe7nURABn0vPz6hVGST8DEr7YJaDS6jV.	+237671447813	t	2026-08-25 10:52:44.880697	2026-08-25 10:52:44.880697
7	fabrel	zeze	fabrel@ttesicg.com	$2a$10$Taim1PNF1wN02XGqop9LouYbfv5jUFi3dnU0Z7i5yIF7LxAFTZvVe	+237671447813	t	2026-08-25 10:53:38.165703	2026-08-25 10:53:38.165703
1	Admin	TTES ICG	admin@ttesicg.com	$2a$10$SttuGhI1hzcEyvGX62swJe/IRwHkDr4i2R5bsBIK8daDhKrWIeMOe	6666666666666	t	2026-08-18 14:53:19.158037	2026-08-25 10:55:17.274354
8	pavel junior	tsakeng tsafack	junior@ttesicg.com	$2a$10$SoHeDa7ivAfpMDSaNyCy4e53DcCcFY.5JfTaVZCSXPCnMq3Epyx4m	691085447	t	2026-08-25 17:57:53.353493	2026-08-25 17:57:53.353493
9	pavel junior	tsakeng tsafack	junior2@ttesicg.com	$2a$10$yBQaPL6pqbi6/Nn4bQpI0OukoqRZqAQ/8qqu5cYWKsgdg7n92KjGi	691085447	t	2026-08-25 17:59:13.426164	2026-08-25 17:59:13.426164
10	junior	junior	junior3@ttesicg.com	$2a$10$6P46dbZmn1UDzny9gSYv7uZ1G6mbkoTWINuEna1iBHKidn6KxjvxK	+237671447813	t	2026-08-25 18:00:49.441048	2026-08-25 18:00:49.441048
11	NONO	nono	nono@gmail.com	$2a$10$W3.auYqtIIU7qpCGiYiNw.wpKYkQkP8J0Dr/rhMUZrJbhqHb6dex.	690607090	t	2026-08-26 10:32:55.630659	2026-08-26 10:32:55.630659
12	fabrel	pavel	pv@ttesicg.com	$2a$10$52kq4r7X2Yvrm4jtTa4TZe.emkGKqnxN//xPwfP3Imwrb.LwulFa6	6666666666	t	2026-08-26 10:37:35.997497	2026-08-26 10:37:35.997497
13	junior	zeze	zeze@ttesicg.com	$2a$10$tyK5Q1sIa51kDmZIjLs5Eu/DSzQZWg.OpAaEE/nA0AD2Tf5f7CgLm	6666666666	t	2026-08-26 11:11:16.142218	2026-08-26 11:31:56.175974
14	Pavel	Tsakeng	tsakengjr@gmail.com	$2a$10$RTo3J50.7r8m8pCQyLGp6uiifPZ8/ovfAX7JR./lWZVhX0YORULqS	691085447	t	2026-08-26 14:14:38.235388	2026-08-26 14:14:38.235388
15	fabrel	nono	tsaformatt78@gmail.com	$2a$10$nXpg9O37yDxrP9ZL4ZOBgOOz2SGzfm8P6IqxvVuEwXzPmQIckTTE2	+237674277897	t	2026-08-26 14:15:42.884933	2026-08-26 14:15:42.884933
16	pavel junior	nono	nonoma@gmail.com	$2a$10$9HRBMJkfxfsr7aGQQDxOV.uzdW3PhSNEvuiicpS6Xc9mLW.vyH7H2	+237674277897	t	2026-08-26 14:42:09.690761	2026-08-26 14:42:09.690761
17	Junior	Tsakeng	tsakeng@gmail.com	$2a$10$/ou7fa5Dqdp8B75AipSuOeOYQ6GxBNib1omn8vTM0PnyNQAh2nWte	+237691085447	t	2026-08-26 14:55:30.624989	2026-08-26 14:55:30.624989
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carts (id, user_id, created_at, updated_at) FROM stdin;
1	1	2026-08-19 11:36:16.229493	2026-08-19 11:36:16.229493
2	2	2026-08-22 17:44:26.701788	2026-08-22 17:44:26.701788
3	4	2026-08-24 14:37:03.73018	2026-08-24 14:37:03.73018
4	5	2026-08-24 15:30:27.374629	2026-08-24 15:30:27.374629
5	8	2026-08-25 17:59:33.442475	2026-08-25 17:59:33.442475
6	12	2026-08-26 10:37:49.26745	2026-08-26 10:37:49.26745
7	13	2026-08-26 11:11:17.691651	2026-08-26 11:11:17.691651
8	14	2026-08-26 14:14:39.974746	2026-08-26 14:14:39.974746
9	15	2026-08-26 14:15:44.442897	2026-08-26 14:15:44.442897
10	16	2026-08-26 14:42:11.434178	2026-08-26 14:42:11.434178
11	17	2026-08-26 14:55:32.283323	2026-08-26 14:55:32.283323
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.companies (id, name, description, logo_url, website, email, phone, active, created_at, updated_at, country) FROM stdin;
1	Sanofi	Laboratoire pharmaceutique	\N	https://www.sanofi.com	\N	\N	t	2026-08-18 16:32:47.617577	2026-08-18 16:32:47.617577	France
2	ttes icg	pharmaties	\N	www.ttesicg.com	\N	\N	t	2026-08-21 15:24:38.13173	2026-08-21 15:24:52.684258	cameroun
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, company_id, name, sku, description, brand, active_ingredient, dosage, form, price, requires_prescription, active, created_at, updated_at) FROM stdin;
2	1	Doliprane	DOL001	Paracetamol	Sanofi	Paracetamol	500mg	Comprimé	2500.00	t	t	2026-08-19 11:01:44.564789	2026-08-22 12:03:33.751527
1	1	Doliprane 1000mg	DOL1000	Antalgique contre la douleur et la fièvre	Sanofi	Paracetamol	1000 mg	Comprimé	5.50	t	t	2026-08-18 17:33:57.772849	2026-08-25 17:47:03.1179
5	2	couscous	oups	la nouriture	gombo	para	500	comprime	100.00	f	t	2026-08-21 11:40:07.816189	2026-08-26 13:11:43.840805
7	1	Ubi	Ubi 500		Das	Ubi	250	Liquide 	750.00	t	t	2026-08-26 15:08:14.048034	2026-08-26 16:00:09.746701
8	2	nono	kfkf		okdoke	medm	5667	lld	434.00	t	t	2026-08-26 16:18:21.941327	2026-08-26 16:18:21.941327
9	2	kojef	jkojolkf		kojkofv	kokok	okokor	kjkjkjmr	1100.00	t	t	2026-08-26 16:42:58.004559	2026-08-26 16:42:58.004559
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cart_items (id, cart_id, product_id, quantity, price) FROM stdin;
35	7	2	1	2500.00
38	9	5	1	100.00
27	4	1	1	5.50
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, description, image_url, parent_id, active, created_at, updated_at) FROM stdin;
1	Médicaments	Produits pharmaceutiques	\N	\N	t	2026-08-18 17:04:08.69628	2026-08-18 17:04:08.69628
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	init	SQL	V1__init.sql	-891960716	postgres	2026-08-18 12:49:21.32331	205	t
2	2	create core tables	SQL	V2__create_core_tables.sql	2010780652	postgres	2026-08-18 12:52:28.588238	178	t
3	3	remove test connection	SQL	V3__remove_test_connection.sql	-1572184004	postgres	2026-08-18 12:56:39.687728	16	t
4	4	insert default roles	SQL	V4__insert_default_roles.sql	1767787583	postgres	2026-08-18 14:02:42.093636	52	t
5	5	add country to company	SQL	V5__add_country_to_company.sql	1525999145	postgres	2026-08-18 15:11:31.084957	50	t
6	7	create cart	SQL	V7__create_cart.sql	1010748563	postgres	2026-08-19 11:35:47.453652	223	t
7	8	create orders	SQL	V8__create_orders.sql	1895733563	postgres	2026-08-19 12:18:09.737309	97	t
8	9	add order delivery information	SQL	V9__add_order_delivery_information.sql	-1740146505	postgres	2026-08-20 11:36:50.613962	70	t
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory (id, product_id, quantity, minimum_quantity, updated_at) FROM stdin;
3	5	19	15	2026-08-25 13:40:33.594785
6	8	10	0	2026-08-26 16:29:13.159565
7	9	15	0	2026-08-26 16:42:58.023555
5	7	7	0	2026-08-26 16:52:38.00901
1	2	86	20	2026-08-27 10:54:23.085068
2	1	16	1	2026-08-29 17:08:24.982811
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, user_id, status, total_amount, created_at, updated_at, delivery_address, customer_note) FROM stdin;
1	1	CONFIRMED	22.00	2026-08-19 12:25:07.336073	2026-08-19 14:26:22.276769	Adresse non renseignée	\N
2	1	PENDING	11.00	2026-08-19 15:02:22.256119	2026-08-19 15:02:22.256119	Adresse non renseignée	\N
3	1	CONFIRMED	5077.00	2026-08-20 12:25:10.984672	2026-08-21 18:08:34.042664	Yaoundé, Bastos, Rue 123	Livrer après 17h
4	1	PENDING	2605.50	2026-08-22 17:42:01.622861	2026-08-22 17:42:01.622861	douala	faite vite
5	2	PENDING	22.00	2026-08-22 17:45:14.114204	2026-08-22 17:45:14.114204	akwa	fqite vite
6	2	PENDING	100.00	2026-08-22 17:46:04.184603	2026-08-22 17:46:04.184603	ok	ok
7	2	PENDING	100.00	2026-08-22 17:46:36.228064	2026-08-22 17:46:36.228064	ok	
8	2	PENDING	5.50	2026-08-22 17:48:06.232008	2026-08-22 17:48:06.232008	ok	
9	1	PENDING	12605.50	2026-08-22 18:20:54.597971	2026-08-22 18:20:54.597971	douqlq	
10	1	PENDING	100.00	2026-08-22 18:21:20.493391	2026-08-22 18:21:20.493391	douala	
11	2	PENDING	55.00	2026-08-24 09:30:22.799255	2026-08-24 09:30:22.799255	dubai	
12	2	PENDING	100.00	2026-08-24 09:51:48.931244	2026-08-24 09:51:48.931244	ok	\N
13	2	PENDING	200.00	2026-08-24 14:35:55.367636	2026-08-24 14:35:55.367636	dokoti	\N
14	4	PENDING	105.50	2026-08-24 14:39:31.881946	2026-08-24 14:39:31.881946	dokoti akwa	\N
15	4	PENDING	5.50	2026-08-24 18:10:25.284627	2026-08-24 18:10:25.284627	makepe	\N
16	1	PENDING	927.50	2026-08-25 10:54:32.972112	2026-08-25 10:54:32.972112	AKWA	\N
17	1	PENDING	2500.00	2026-08-25 10:55:49.58117	2026-08-25 10:55:49.58117	AKWA	\N
18	2	PENDING	100.00	2026-08-25 12:34:14.032922	2026-08-25 12:34:14.032922	NDOKOTI	\N
19	2	PENDING	100.00	2026-08-25 13:40:33.585787	2026-08-25 13:40:33.585787	AKWA	\N
20	2	PENDING	2500.00	2026-08-25 13:45:07.067565	2026-08-25 13:45:07.067565	akaza	\N
21	8	PENDING	5.50	2026-08-26 13:34:55.782302	2026-08-26 13:34:55.782302	akwa	\N
22	8	PENDING	2500.00	2026-08-26 13:42:47.068364	2026-08-26 13:42:47.068364	okok	\N
23	16	PENDING	2500.00	2026-08-26 14:52:46.014341	2026-08-26 14:52:46.014341	popop	\N
24	17	PENDING	2500.00	2026-08-26 14:56:04.534617	2026-08-26 14:56:04.534617	Akwa	\N
25	16	PENDING	1500.00	2026-08-26 16:52:37.990045	2026-08-26 16:52:37.990045	douala	\N
26	1	PENDING	2500.00	2026-08-27 10:54:23.073039	2026-08-27 10:54:23.073039	douala	\N
27	1	PENDING	38.50	2026-08-29 17:08:24.901747	2026-08-29 17:08:24.901747	akwq	\N
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, product_id, quantity, price) FROM stdin;
1	1	1	4	5.50
2	2	1	2	5.50
3	3	1	14	5.50
4	3	2	2	2500.00
5	4	1	1	5.50
6	4	2	1	2500.00
7	4	5	1	100.00
8	5	1	4	5.50
9	6	5	1	100.00
10	7	5	1	100.00
11	8	1	1	5.50
12	9	2	5	2500.00
13	9	1	1	5.50
14	9	5	1	100.00
15	10	5	1	100.00
16	11	1	10	5.50
17	12	5	1	100.00
18	13	5	2	100.00
19	14	1	1	5.50
20	14	5	1	100.00
21	15	1	1	5.50
22	16	5	9	100.00
23	16	1	5	5.50
24	17	2	1	2500.00
25	18	5	1	100.00
26	19	5	1	100.00
27	20	2	1	2500.00
28	21	1	1	5.50
29	22	2	1	2500.00
30	23	2	1	2500.00
31	24	2	1	2500.00
32	25	7	2	750.00
33	26	2	1	2500.00
34	27	1	7	5.50
\.


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_categories (product_id, category_id) FROM stdin;
7	1
8	1
9	1
\.


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_images (id, product_id, image_url, is_main, display_order, created_at) FROM stdin;
6	2	http://localhost:4200/images/product/product-01.jpg	t	0	2026-08-25 17:45:44.568462
7	1	http://localhost:4200/images/product/product-01.jpg	f	0	2026-08-25 17:46:39.742958
9	5	http://localhost:4200/images/logo/logo.svg	t	0	2026-08-25 17:47:44.035215
10	5	https://tse1.mm.bing.net/th/id/OIP.cW0wzJYojHH-xxW35Wj7dQHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3	t	1	2026-08-26 12:13:54.69564
12	7	https://pixlr.com/images/generator/simple-generator.webp	t	1	2026-08-26 16:01:25.688979
\.


--
-- Data for Name: therapeutic_areas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.therapeutic_areas (id, name, description, active, created_at, updated_at) FROM stdin;
1	Cardiologie	Traitements liés au cœur et aux vaisseaux sanguins	t	2026-08-18 17:14:57.445885	2026-08-18 17:14:57.445885
5	operqtion	operer	t	2026-08-21 16:06:41.641754	2026-08-21 16:06:41.641754
6	cerebral	cerebro	t	2026-08-21 16:10:25.024745	2026-08-21 16:10:25.024745
\.


--
-- Data for Name: product_therapeutic_areas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_therapeutic_areas (product_id, therapeutic_area_id) FROM stdin;
7	6
8	6
8	1
9	5
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name) FROM stdin;
1	ADMIN
2	CLIENT
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (user_id, role_id) FROM stdin;
1	1
2	2
3	2
4	2
5	2
6	2
7	2
8	2
9	2
10	2
11	2
12	2
13	2
14	2
15	2
16	2
17	2
\.


--
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 45, true);


--
-- Name: carts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.carts_id_seq', 11, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 2, true);


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.companies_id_seq', 2, true);


--
-- Name: inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_id_seq', 7, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_items_id_seq', 34, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 27, true);


--
-- Name: product_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_images_id_seq', 12, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 9, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 2, true);


--
-- Name: therapeutic_areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.therapeutic_areas_id_seq', 7, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 17, true);


--
-- PostgreSQL database dump complete
--

\unrestrict UOrX81TxHDW8AYaTQ6PJramowugRrrjeS8zhrA4FV19GS6qHwcm7q6OnfirXbLN

