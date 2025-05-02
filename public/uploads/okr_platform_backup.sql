--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: feedback_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.feedback_type AS ENUM (
    'positive',
    'constructive',
    'general',
    'recognition'
);


ALTER TYPE public.feedback_type OWNER TO neondb_owner;

--
-- Name: status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.status AS ENUM (
    'not_started',
    'on_track',
    'at_risk',
    'behind',
    'completed'
);


ALTER TYPE public.status OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: access_groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.access_groups (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    permissions json NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.access_groups OWNER TO neondb_owner;

--
-- Name: access_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.access_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.access_groups_id_seq OWNER TO neondb_owner;

--
-- Name: access_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.access_groups_id_seq OWNED BY public.access_groups.id;


--
-- Name: attachments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.attachments (
    id integer NOT NULL,
    message_id integer NOT NULL,
    file_name text NOT NULL,
    file_type text NOT NULL,
    file_size integer NOT NULL,
    file_url text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.attachments OWNER TO neondb_owner;

--
-- Name: attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attachments_id_seq OWNER TO neondb_owner;

--
-- Name: attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.attachments_id_seq OWNED BY public.attachments.id;


--
-- Name: badges; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.badges (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    color text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.badges OWNER TO neondb_owner;

--
-- Name: badges_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.badges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.badges_id_seq OWNER TO neondb_owner;

--
-- Name: badges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.badges_id_seq OWNED BY public.badges.id;


--
-- Name: cadences; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cadences (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    period text NOT NULL,
    start_month integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cadences OWNER TO neondb_owner;

--
-- Name: cadences_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cadences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cadences_id_seq OWNER TO neondb_owner;

--
-- Name: cadences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cadences_id_seq OWNED BY public.cadences.id;


--
-- Name: chat_room_members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.chat_room_members (
    id integer NOT NULL,
    chat_room_id integer NOT NULL,
    user_id integer NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    joined_at timestamp without time zone DEFAULT now() NOT NULL,
    last_read timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chat_room_members OWNER TO neondb_owner;

--
-- Name: chat_room_members_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.chat_room_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_room_members_id_seq OWNER TO neondb_owner;

--
-- Name: chat_room_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.chat_room_members_id_seq OWNED BY public.chat_room_members.id;


--
-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.chat_rooms (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    type text DEFAULT 'direct'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer NOT NULL
);


ALTER TABLE public.chat_rooms OWNER TO neondb_owner;

--
-- Name: chat_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.chat_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_rooms_id_seq OWNER TO neondb_owner;

--
-- Name: chat_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.chat_rooms_id_seq OWNED BY public.chat_rooms.id;


--
-- Name: check_ins; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.check_ins (
    id integer NOT NULL,
    objective_id integer,
    key_result_id integer,
    user_id integer NOT NULL,
    progress integer,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.check_ins OWNER TO neondb_owner;

--
-- Name: check_ins_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.check_ins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.check_ins_id_seq OWNER TO neondb_owner;

--
-- Name: check_ins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.check_ins_id_seq OWNED BY public.check_ins.id;


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.feedback (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    type public.feedback_type NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    visibility text NOT NULL,
    objective_id integer,
    key_result_id integer,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.feedback OWNER TO neondb_owner;

--
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_id_seq OWNER TO neondb_owner;

--
-- Name: feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.feedback_id_seq OWNED BY public.feedback.id;


--
-- Name: highfive_recipients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.highfive_recipients (
    id integer NOT NULL,
    highfive_id integer NOT NULL,
    recipient_id integer NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.highfive_recipients OWNER TO neondb_owner;

--
-- Name: highfive_recipients_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.highfive_recipients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.highfive_recipients_id_seq OWNER TO neondb_owner;

--
-- Name: highfive_recipients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.highfive_recipients_id_seq OWNED BY public.highfive_recipients.id;


--
-- Name: highfives; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.highfives (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    message text NOT NULL,
    objective_id integer,
    key_result_id integer,
    is_public boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.highfives OWNER TO neondb_owner;

--
-- Name: highfives_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.highfives_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.highfives_id_seq OWNER TO neondb_owner;

--
-- Name: highfives_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.highfives_id_seq OWNED BY public.highfives.id;


--
-- Name: initiatives; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.initiatives (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    key_result_id integer NOT NULL,
    assigned_to_id integer,
    status text DEFAULT 'not_started'::text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.initiatives OWNER TO neondb_owner;

--
-- Name: initiatives_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.initiatives_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.initiatives_id_seq OWNER TO neondb_owner;

--
-- Name: initiatives_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.initiatives_id_seq OWNED BY public.initiatives.id;


--
-- Name: key_results; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.key_results (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    objective_id integer NOT NULL,
    assigned_to_id integer,
    target_value text,
    current_value text,
    start_value text,
    progress integer DEFAULT 0,
    status text DEFAULT 'not_started'::text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.key_results OWNER TO neondb_owner;

--
-- Name: key_results_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.key_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.key_results_id_seq OWNER TO neondb_owner;

--
-- Name: key_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.key_results_id_seq OWNED BY public.key_results.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    chat_room_id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    type text DEFAULT 'text'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    is_edited boolean DEFAULT false NOT NULL,
    reply_to_id integer
);


ALTER TABLE public.messages OWNER TO neondb_owner;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO neondb_owner;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: objectives; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.objectives (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    level text NOT NULL,
    owner_id integer NOT NULL,
    team_id integer,
    timeframe_id integer NOT NULL,
    status text DEFAULT 'not_started'::text,
    progress integer DEFAULT 0,
    parent_id integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.objectives OWNER TO neondb_owner;

--
-- Name: objectives_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.objectives_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.objectives_id_seq OWNER TO neondb_owner;

--
-- Name: objectives_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.objectives_id_seq OWNED BY public.objectives.id;


--
-- Name: reactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.reactions (
    id integer NOT NULL,
    message_id integer NOT NULL,
    user_id integer NOT NULL,
    emoji text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reactions OWNER TO neondb_owner;

--
-- Name: reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reactions_id_seq OWNER TO neondb_owner;

--
-- Name: reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.reactions_id_seq OWNED BY public.reactions.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.teams (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6'::text,
    icon text DEFAULT 'building'::text,
    parent_id integer,
    owner_id integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.teams OWNER TO neondb_owner;

--
-- Name: teams_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.teams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teams_id_seq OWNER TO neondb_owner;

--
-- Name: teams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id;


--
-- Name: timeframes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.timeframes (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    cadence_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.timeframes OWNER TO neondb_owner;

--
-- Name: timeframes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.timeframes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.timeframes_id_seq OWNER TO neondb_owner;

--
-- Name: timeframes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.timeframes_id_seq OWNED BY public.timeframes.id;


--
-- Name: user_access_groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_access_groups (
    id integer NOT NULL,
    user_id integer NOT NULL,
    access_group_id integer NOT NULL
);


ALTER TABLE public.user_access_groups OWNER TO neondb_owner;

--
-- Name: user_access_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_access_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_access_groups_id_seq OWNER TO neondb_owner;

--
-- Name: user_access_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_access_groups_id_seq OWNED BY public.user_access_groups.id;


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_badges (
    id integer NOT NULL,
    user_id integer NOT NULL,
    badge_id integer NOT NULL,
    awarded_by_id integer NOT NULL,
    message text,
    is_public boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_badges OWNER TO neondb_owner;

--
-- Name: user_badges_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_badges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_badges_id_seq OWNER TO neondb_owner;

--
-- Name: user_badges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_badges_id_seq OWNED BY public.user_badges.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    language text DEFAULT 'en'::text,
    role text DEFAULT 'user'::text,
    manager_id integer,
    team_id integer,
    created_at timestamp without time zone DEFAULT now(),
    first_login boolean DEFAULT true,
    intro_video_watched boolean DEFAULT false,
    walkthrough_completed boolean DEFAULT false,
    onboarding_progress integer DEFAULT 0,
    last_onboarding_step text
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: access_groups id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.access_groups ALTER COLUMN id SET DEFAULT nextval('public.access_groups_id_seq'::regclass);


--
-- Name: attachments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attachments ALTER COLUMN id SET DEFAULT nextval('public.attachments_id_seq'::regclass);


--
-- Name: badges id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.badges ALTER COLUMN id SET DEFAULT nextval('public.badges_id_seq'::regclass);


--
-- Name: cadences id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cadences ALTER COLUMN id SET DEFAULT nextval('public.cadences_id_seq'::regclass);


--
-- Name: chat_room_members id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_room_members ALTER COLUMN id SET DEFAULT nextval('public.chat_room_members_id_seq'::regclass);


--
-- Name: chat_rooms id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_rooms ALTER COLUMN id SET DEFAULT nextval('public.chat_rooms_id_seq'::regclass);


--
-- Name: check_ins id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.check_ins ALTER COLUMN id SET DEFAULT nextval('public.check_ins_id_seq'::regclass);


--
-- Name: feedback id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback ALTER COLUMN id SET DEFAULT nextval('public.feedback_id_seq'::regclass);


--
-- Name: highfive_recipients id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.highfive_recipients ALTER COLUMN id SET DEFAULT nextval('public.highfive_recipients_id_seq'::regclass);


--
-- Name: highfives id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.highfives ALTER COLUMN id SET DEFAULT nextval('public.highfives_id_seq'::regclass);


--
-- Name: initiatives id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.initiatives ALTER COLUMN id SET DEFAULT nextval('public.initiatives_id_seq'::regclass);


--
-- Name: key_results id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.key_results ALTER COLUMN id SET DEFAULT nextval('public.key_results_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: objectives id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.objectives ALTER COLUMN id SET DEFAULT nextval('public.objectives_id_seq'::regclass);


--
-- Name: reactions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reactions ALTER COLUMN id SET DEFAULT nextval('public.reactions_id_seq'::regclass);


--
-- Name: teams id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);


--
-- Name: timeframes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.timeframes ALTER COLUMN id SET DEFAULT nextval('public.timeframes_id_seq'::regclass);


--
-- Name: user_access_groups id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_access_groups ALTER COLUMN id SET DEFAULT nextval('public.user_access_groups_id_seq'::regclass);


--
-- Name: user_badges id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_badges ALTER COLUMN id SET DEFAULT nextval('public.user_badges_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: access_groups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.access_groups (id, name, description, permissions, created_at) FROM stdin;
4	Leadership Team	C-level executives and department heads	{"admin":true,"viewAll":true,"editAll":true}	2025-04-24 08:22:39.540654
5	Management	Team managers and project leads	{"manageTeam":true,"assignObjectives":true,"viewDepartmentData":true}	2025-04-24 08:22:39.604543
6	Product Development	Product managers, engineers, and designers	{"viewProductData":true,"updateProgress":true}	2025-04-24 08:22:39.635934
7	Marketing	Marketing specialists and content creators	{"viewMarketingData":true,"updateProgress":true}	2025-04-24 08:22:39.666753
8	Sales	Sales representatives and account managers	{"viewSalesData":true,"updateProgress":true}	2025-04-24 08:22:39.697953
\.


--
-- Data for Name: attachments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.attachments (id, message_id, file_name, file_type, file_size, file_url, created_at) FROM stdin;
\.


--
-- Data for Name: badges; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.badges (id, name, description, icon, color, created_at) FROM stdin;
1	Team Player	Awarded for exceptional collaboration and teamwork	users-2	#4CAF50	2025-04-30 08:23:11.134362
2	Innovation Champion	Recognizes innovative ideas and creative solutions	lightbulb	#FF9800	2025-04-30 08:23:11.134362
3	Customer Hero	Awarded for outstanding customer service	heart-handshake	#E91E63	2025-04-30 08:23:11.134362
4	Rising Star	Recognizes rapid growth and exceptional potential	rocket	#2196F3	2025-04-30 08:23:11.134362
5	Excellence Award	For consistently exceeding expectations	award	#9C27B0	2025-04-30 08:23:11.134362
\.


--
-- Data for Name: cadences; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.cadences (id, name, description, period, start_month, created_at) FROM stdin;
4	Annual	Yearly planning cycle	annual	\N	2025-04-24 08:22:37.875196
5	Quarterly	Quarterly planning cycle	quarterly	\N	2025-04-24 08:22:37.910326
6	Monthly	Monthly planning cycle	monthly	\N	2025-04-24 08:22:37.942762
\.


--
-- Data for Name: chat_room_members; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.chat_room_members (id, chat_room_id, user_id, role, joined_at, last_read) FROM stdin;
1	1	3	member	2025-04-24 08:22:40.159959	2025-04-24 08:22:40.159959
2	1	4	member	2025-04-24 08:22:40.179001	2025-04-24 08:22:40.179001
3	1	5	member	2025-04-24 08:22:40.195859	2025-04-24 08:22:40.195859
4	1	1	member	2025-04-24 08:22:40.215346	2025-04-24 08:22:40.215346
5	1	2	member	2025-04-24 08:22:40.231592	2025-04-24 08:22:40.231592
6	1	6	member	2025-04-24 08:22:40.247912	2025-04-24 08:22:40.247912
7	1	7	member	2025-04-24 08:22:40.264717	2025-04-24 08:22:40.264717
8	1	8	member	2025-04-24 08:22:40.280964	2025-04-24 08:22:40.280964
9	1	9	member	2025-04-24 08:22:40.296869	2025-04-24 08:22:40.296869
10	1	10	member	2025-04-24 08:22:40.312689	2025-04-24 08:22:40.312689
11	2	3	member	2025-04-24 08:22:40.328853	2025-04-24 08:22:40.328853
12	2	1	admin	2025-04-24 08:22:40.345105	2025-04-24 08:22:40.345105
13	2	2	member	2025-04-24 08:22:40.362782	2025-04-24 08:22:40.362782
14	3	4	member	2025-04-24 08:22:40.378711	2025-04-24 08:22:40.378711
15	3	6	member	2025-04-24 08:22:40.394542	2025-04-24 08:22:40.394542
16	3	7	member	2025-04-24 08:22:40.410247	2025-04-24 08:22:40.410247
17	4	3	admin	2025-04-24 08:22:40.4262	2025-04-24 08:22:40.4262
18	4	5	member	2025-04-24 08:22:40.443119	2025-04-24 08:22:40.443119
19	4	2	admin	2025-04-24 08:22:40.458864	2025-04-24 08:22:40.458864
20	4	8	member	2025-04-24 08:22:40.475132	2025-04-24 08:22:40.475132
21	5	9	member	2025-04-24 08:22:40.491304	2025-04-24 08:22:40.491304
22	5	10	member	2025-04-24 08:22:40.507301	2025-04-24 08:22:40.507301
23	6	3	member	2025-04-24 08:22:40.523275	2025-04-24 08:22:40.523275
24	6	1	admin	2025-04-24 08:22:40.539237	2025-04-24 08:22:40.539237
25	6	2	member	2025-04-24 08:22:40.55549	2025-04-24 08:22:40.55549
\.


--
-- Data for Name: chat_rooms; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.chat_rooms (id, name, description, type, created_at, updated_at, created_by) FROM stdin;
1	Company Announcements	Official company-wide announcements	channel	2025-04-24 08:22:39.984888	2025-04-24 08:22:39.984888	1
2	Leadership Discussion	Discussion forum for leadership team	channel	2025-04-24 08:22:40.01809	2025-04-24 08:22:40.01809	1
3	Marketing Team	Marketing team discussions	channel	2025-04-24 08:22:40.04916	2025-04-24 08:22:40.04916	2
4	Product Team	Product team discussions	channel	2025-04-24 08:22:40.080439	2025-04-24 08:22:40.080439	4
5	Sales Team	Sales team discussions	channel	2025-04-24 08:22:40.111604	2025-04-24 08:22:40.111604	5
6	Q2 OKR Planning	Planning OKRs for Q2	channel	2025-04-24 08:22:40.143518	2025-04-24 08:22:40.143518	1
\.


--
-- Data for Name: check_ins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.check_ins (id, objective_id, key_result_id, user_id, progress, notes, created_at) FROM stdin;
1	2	\N	2	35	We're making steady progress on increasing revenue. Q1 targets were almost met, and Q2 is looking promising.	2025-04-24 08:22:39.247594
2	4	\N	4	20	Product development is on track, but we're facing some challenges with the supply chain.	2025-04-24 08:22:39.267575
3	\N	3	5	67	We've implemented new sales processes that are starting to show results. Average cycle time is down to 35 days.	2025-04-24 08:22:39.284042
4	\N	2	3	58	The LinkedIn campaign is performing well. We've generated 750 leads so far.	2025-04-24 08:22:39.364444
5	\N	1	6	63	We've completed 5 out of 8 development sprints. Sprint 6 is starting next week.	2025-04-24 08:22:39.450547
6	\N	2	1	0	fgnbghf	2025-04-29 12:19:01.161083
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.feedback (id, sender_id, receiver_id, type, title, message, visibility, objective_id, key_result_id, is_read, created_at) FROM stdin;
1	2	4	positive	Great work on the project!	Your attention to detail and dedication to meeting project deadlines has been exceptional. Keep up the excellent work!	public	\N	\N	f	2025-04-28 08:23:41.828797
2	3	6	recognition	Outstanding customer support	You went above and beyond to help our clients resolve their issues. Your patience and technical expertise made a huge difference.	public	\N	\N	t	2025-04-25 08:23:41.828797
3	5	8	positive	Excellent teamwork	Your collaboration skills helped the team overcome challenges and deliver the project on time. Thanks for your contributions!	public	\N	\N	f	2025-04-29 08:23:41.828797
4	7	9	recognition	Innovation recognition	Your creative solution to the database performance issue saved us hours of work. Thanks for thinking outside the box!	public	\N	\N	t	2025-04-27 08:23:41.828797
5	2	5	constructive	Communication improvements	I appreciate your hard work, but I think we could improve our team communication. Let us discuss some strategies in our next 1:1.	private	\N	\N	f	2025-04-26 08:23:41.828797
6	3	7	general	Project update feedback	Thank you for your detailed project updates. They have been very helpful for keeping stakeholders informed.	private	\N	\N	t	2025-04-24 08:23:41.828797
\.


--
-- Data for Name: highfive_recipients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.highfive_recipients (id, highfive_id, recipient_id, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: highfives; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.highfives (id, sender_id, message, objective_id, key_result_id, is_public, created_at) FROM stdin;
\.


--
-- Data for Name: initiatives; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.initiatives (id, title, description, key_result_id, assigned_to_id, status, created_at) FROM stdin;
1	LinkedIn Advertising Campaign	Run targeted ads on LinkedIn to generate B2B leads	8	\N	in_progress	2025-04-24 08:22:39.027109
2	Content Calendar Development	Create a comprehensive content calendar for Q2	9	\N	completed	2025-04-24 08:22:39.060427
3	Development Sprint 6 Planning	Plan and kickoff development sprint 6	10	\N	in_progress	2025-04-24 08:22:39.091805
4	Test Automation Framework	Implement automated testing framework for the new product	11	\N	in_progress	2025-04-24 08:22:39.122711
5	Sales Team Training Workshop	Conduct a 2-day workshop on new sales methodologies	12	\N	completed	2025-04-24 08:22:39.153733
6	Sales Process Optimization	Review and optimize the current sales process to reduce cycle time	13	\N	in_progress	2025-04-24 08:22:39.185187
\.


--
-- Data for Name: key_results; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.key_results (id, title, description, objective_id, assigned_to_id, target_value, current_value, start_value, progress, status, created_at) FROM stdin;
4	Support Response Time	Reduce average support response time to under 4 hours	3	\N	4	24	24	87	not_started	2025-04-24 08:22:38.71452
5	NPS Score	Increase Net Promoter Score from 35 to 50	3	\N	50	35	35	47	not_started	2025-04-24 08:22:38.748342
6	Beta Program	Enroll 500 customers in the beta program	4	\N	500	0	0	64	not_started	2025-04-24 08:22:38.779878
7	Feature Completion	Complete 100% of planned features for initial release	4	\N	100	0	0	65	not_started	2025-04-24 08:22:38.811197
8	Organic Lead Generation	Generate 1,000 organic leads per month by end of Q2	5	\N	1000	400	400	58	not_started	2025-04-24 08:22:38.841331
9	Content Marketing Performance	Increase blog traffic by 50% by end of Q2	5	\N	150	100	100	60	not_started	2025-04-24 08:22:38.870242
10	Development Sprints Completion	Complete all 8 development sprints by end of Q2	6	\N	8	0	0	63	not_started	2025-04-24 08:22:38.902588
11	Quality Assurance	Achieve 98% test coverage for all new code	6	\N	98	80	80	67	not_started	2025-04-24 08:22:38.933691
12	Sales Training Completion	Complete sales training for all team members	7	\N	100	0	0	75	not_started	2025-04-24 08:22:38.964794
13	Sales Cycle Length	Reduce average sales cycle from 45 days to 30 days	7	\N	30	45	45	67	not_started	2025-04-24 08:22:38.995945
3	New Enterprise Deals	Close 15 new enterprise deals by end of year	2	\N	15	0	0	67	not_started	2025-04-24 08:22:38.682801
1	Q1 Revenue Target	Achieve $2.5M in Q1 revenue	2	\N	2500000	0	0	63	not_started	2025-04-24 08:22:38.617203
2	Q2 Revenue Target	Achieve $3M in Q2 revenue	2	\N	3000000	0	0	0	not_started	2025-04-24 08:22:38.651618
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.messages (id, chat_room_id, user_id, content, type, created_at, updated_at, deleted_at, is_edited, reply_to_id) FROM stdin;
1	1	1	Welcome to the Company Announcements channel! Important company-wide information will be shared here.	text	2025-04-24 08:22:40.572273	2025-04-24 08:22:40.572273	\N	f	\N
2	1	1	Our Q1 results are in! We've achieved 94% of our revenue target for the quarter. Great job everyone!	text	2025-04-24 08:22:40.590841	2025-04-24 08:22:40.590841	\N	f	\N
3	2	1	Let's discuss our approach to Q2 planning. I'd like to get everyone's thoughts on our key focus areas.	text	2025-04-24 08:22:40.607056	2025-04-24 08:22:40.607056	\N	f	\N
4	2	2	I think we should focus on improving customer retention. Our churn rate has been creeping up.	text	2025-04-24 08:22:40.625046	2025-04-24 08:22:40.625046	\N	f	\N
5	2	4	The new product development is on track. We're planning to release the beta in Q2.	text	2025-04-24 08:22:40.644467	2025-04-24 08:22:40.644467	\N	f	\N
6	3	2	Team, our new campaign is launching next week. Please review the creative assets by Friday.	text	2025-04-24 08:22:40.661039	2025-04-24 08:22:40.661039	\N	f	\N
7	3	3	I've uploaded the draft blog posts for review. Can someone give me feedback?	text	2025-04-24 08:22:40.676339	2025-04-24 08:22:40.676339	\N	f	\N
8	4	4	Sprint 6 planning is this Thursday. Please update your current tasks in the system.	text	2025-04-24 08:22:40.692396	2025-04-24 08:22:40.692396	\N	f	\N
9	4	6	I've completed the API documentation. It's ready for review.	text	2025-04-24 08:22:40.708663	2025-04-24 08:22:40.708663	\N	f	\N
10	5	5	Great news! We just closed the Johnson deal. It's our largest this quarter.	text	2025-04-24 08:22:40.724912	2025-04-24 08:22:40.724912	\N	f	\N
11	5	9	I'm meeting with Acme Corp next week. Does anyone have insights about their needs?	text	2025-04-24 08:22:40.74085	2025-04-24 08:22:40.74085	\N	f	\N
12	6	1	Let's use this channel to coordinate our Q2 OKR planning. We'll need to finalize objectives by the end of the month.	text	2025-04-24 08:22:40.757217	2025-04-24 08:22:40.757217	\N	f	\N
13	6	2	The Marketing team is focusing on lead generation and brand awareness for Q2.	text	2025-04-24 08:22:40.773698	2025-04-24 08:22:40.773698	\N	f	\N
14	6	4	Product team will prioritize the new feature release and improving our quality metrics.	text	2025-04-24 08:22:40.789705	2025-04-24 08:22:40.789705	\N	f	\N
\.


--
-- Data for Name: objectives; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.objectives (id, title, description, level, owner_id, team_id, timeframe_id, status, progress, parent_id, created_at) FROM stdin;
3	Improve Customer Satisfaction	Increase overall customer satisfaction score from 8.2 to 9.0	company	1	\N	4	in_progress	42	\N	2025-04-24 08:22:38.459475
5	Increase Marketing Qualified Leads	Generate 2,000 marketing qualified leads per month by end of Q2	department	2	1	7	in_progress	45	2	2025-04-24 08:22:38.521788
7	Increase Sales Conversion Rate	Improve sales conversion rate from 15% to 20% by end of Q2	department	5	3	7	in_progress	25	2	2025-04-24 08:22:38.585243
4	Improve Launch New Product Line	Successfully launch the new product line by end of Q3	company	1	\N	4	in_progress	20	\N	2025-04-24 08:22:38.491009
6	Improve Complete Product Development	Complete all development sprints for the new product line by end of Q2	department	4	2	7	in_progress	30	4	2025-04-24 08:22:38.553643
2	Increase Annual Revenue	Achieve a 20% increase in annual revenue compared to the previous year	company	1	\N	4	in_progress	43	\N	2025-04-24 08:22:38.421062
\.


--
-- Data for Name: reactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reactions (id, message_id, user_id, emoji, created_at) FROM stdin;
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
Swav8cSE50AnrqFFhtTXuTaeuoMK3Am-	{"cookie":{"originalMaxAge":86400000,"expires":"2025-05-02T14:18:29.970Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-03 08:26:12
yizpl8I2TV2y3aYT-c8YW4D5wGiDTNJd	{"cookie":{"originalMaxAge":86400000,"expires":"2025-05-02T10:07:04.605Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-03 08:22:54
UEYG8WS4eDlOpU6vL3XioYD_Px1Wlvvf	{"cookie":{"originalMaxAge":86400000,"expires":"2025-05-02T13:10:46.978Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-02 17:46:01
2ykbuHE7MNkep-hIO987pI4K_uk660UI	{"cookie":{"originalMaxAge":86400000,"expires":"2025-05-02T12:55:25.952Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-02 15:41:28
dyKNOXXOh-pyoGZn7XmDYNYVGoEkwB2j	{"cookie":{"originalMaxAge":86400000,"expires":"2025-05-02T14:17:10.257Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-03 12:28:04
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.teams (id, name, description, color, icon, parent_id, owner_id, created_at) FROM stdin;
1	Marketing Team	Team responsible for all marketing activities	#3B82F6	building	\N	\N	2025-04-18 14:24:45.691885
2	Product Team	Team responsible for product development	#8B5CF6	code-box	\N	\N	2025-04-18 14:24:45.712382
3	Sales Team	Team responsible for sales and revenue generation	#10B981	line-chart	\N	\N	2025-04-18 14:24:45.731726
4	Engineering Team	The engineering team is responsible for building and maintaining the company's technical infrastructure.	#3B82F6	building	2	\N	2025-04-24 08:20:07.177824
5	Design Team	The design team is responsible for the UI/UX design of the company's products.	#3B82F6	building	2	\N	2025-04-24 08:20:07.226356
6	Customer Success Team	The customer success team is responsible for ensuring customer satisfaction and retention.	#3B82F6	building	3	\N	2025-04-24 08:20:07.265578
\.


--
-- Data for Name: timeframes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.timeframes (id, name, description, start_date, end_date, cadence_id, created_at) FROM stdin;
4	2025	\N	2025-01-01 00:00:00	2025-12-31 00:00:00	4	2025-04-24 08:22:37.974445
5	2026	\N	2026-01-01 00:00:00	2026-12-31 00:00:00	4	2025-04-24 08:22:38.019658
6	Q1 2025	\N	2025-01-01 00:00:00	2025-03-31 00:00:00	5	2025-04-24 08:22:38.051082
7	Q2 2025	\N	2025-04-01 00:00:00	2025-06-30 00:00:00	5	2025-04-24 08:22:38.082228
8	Q3 2025	\N	2025-07-01 00:00:00	2025-09-30 00:00:00	5	2025-04-24 08:22:38.114084
9	Q4 2025	\N	2025-10-01 00:00:00	2025-12-31 00:00:00	5	2025-04-24 08:22:38.144253
10	January 2025	\N	2025-01-01 00:00:00	2025-01-31 00:00:00	6	2025-04-24 08:22:38.175151
11	February 2025	\N	2025-02-01 00:00:00	2025-02-28 00:00:00	6	2025-04-24 08:22:38.207018
12	March 2025	\N	2025-03-01 00:00:00	2025-03-31 00:00:00	6	2025-04-24 08:22:38.238522
13	April 2025	\N	2025-04-01 00:00:00	2025-04-30 00:00:00	6	2025-04-24 08:22:38.281333
14	May 2025	\N	2025-05-01 00:00:00	2025-05-31 00:00:00	6	2025-04-24 08:22:38.313144
15	June 2025	\N	2025-06-01 00:00:00	2025-06-30 00:00:00	6	2025-04-24 08:22:38.343266
\.


--
-- Data for Name: user_access_groups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_access_groups (id, user_id, access_group_id) FROM stdin;
7	1	4
8	3	5
9	3	4
10	2	5
11	2	4
12	3	6
13	5	6
14	2	6
15	8	6
16	4	7
17	6	7
18	7	7
19	9	8
20	10	8
\.


--
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_badges (id, user_id, badge_id, awarded_by_id, message, is_public, created_at) FROM stdin;
1	4	1	2	For exceptional teamwork on the Q2 marketing campaign	t	2025-04-27 08:23:56.815818
2	6	3	3	Awarded for resolving a critical customer issue with patience and expertise	t	2025-04-25 08:23:56.815818
3	8	2	5	For developing an innovative solution to our inventory management system	t	2025-04-26 08:23:56.815818
4	9	4	7	Recognition for rapid skill development and taking on new challenges	t	2025-04-28 08:23:56.815818
5	5	5	2	For consistently delivering high-quality work ahead of deadlines	t	2025-04-29 08:23:56.815818
6	7	1	3	For building strong relationships across departments to improve collaboration	t	2025-04-24 08:23:56.815818
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, first_name, last_name, email, language, role, manager_id, team_id, created_at, first_login, intro_video_watched, walkthrough_completed, onboarding_progress, last_onboarding_step) FROM stdin;
3	mwilliams	836f745c0299186c5a5737f0ed0bcd3173db4dd2b8b726d881ada5ee042a5386437526307d183f49809349ff47455ba10703784724581f2ee0783532c7491817.f349e1ad6c9fcfa92127baf979dcc51c	Michelle	Williams	michelle.williams@example.com	en	manager	\N	2	2025-04-18 14:24:45.53973	t	f	f	0	\N
4	agarcia	836f745c0299186c5a5737f0ed0bcd3173db4dd2b8b726d881ada5ee042a5386437526307d183f49809349ff47455ba10703784724581f2ee0783532c7491817.f349e1ad6c9fcfa92127baf979dcc51c	Alex	Garcia	alex.garcia@example.com	es	user	2	1	2025-04-18 14:24:45.556567	t	f	f	0	\N
5	lchen	836f745c0299186c5a5737f0ed0bcd3173db4dd2b8b726d881ada5ee042a5386437526307d183f49809349ff47455ba10703784724581f2ee0783532c7491817.f349e1ad6c9fcfa92127baf979dcc51c	Li	Chen	li.chen@example.com	en	user	3	2	2025-04-18 14:24:45.572777	t	f	f	0	\N
1	admin	04d519df39231304648352b71288d20579e7816699cc7ffc63712811f69a862670c106a90d0cc67d0a523a860824b6a98a241ed0283e49ab664c81a296c19532.f98f94a9c3ce7828bcee55ee6fccfa7b	Admin	User	admin@example.com	en	admin	\N	\N	2025-04-18 14:24:45.497802	t	f	f	0	\N
2	jsmith	836f745c0299186c5a5737f0ed0bcd3173db4dd2b8b726d881ada5ee042a5386437526307d183f49809349ff47455ba10703784724581f2ee0783532c7491817.f349e1ad6c9fcfa92127baf979dcc51c	John	Smith	john.smith@example.com	en	manager	\N	2	2025-04-18 14:24:45.522632	t	f	f	0	\N
6	rpatel	836f745c0299186c5a5737f0ed0bcd3173db4dd2b8b726d881ada5ee042a5386437526307d183f49809349ff47455ba10703784724581f2ee0783532c7491817.f349e1ad6c9fcfa92127baf979dcc51c	Raj	Patel	raj.patel@example.com	en	user	\N	1	2025-04-18 14:24:45.587811	t	f	f	0	\N
7	sjohnson	ac00b76a5433027c539ee8e4e07deaf58df50c4483ef6b17d8f9089da4a61a3981a3592b0e21e18b57a731098671f33fb54847df99a7b6ba6e75f64cbdd96bd0.63031cd80f350b6b75df87aca4bca185	Sarah	Johnson	sjohnson@company.com	en	user	1	1	2025-04-24 08:20:07.781683	t	f	f	0	\N
8	ykim	2ddb4cbf9f1c75d0aac981ce819e709356cd03fafad9858febc2cd86868a301fb6e5aa2a529ed56f2c6b6f585587d669e9218188eb5127a089993a1b9f96d5ca.289906c18914a0832a76e40301f5188c	Yuna	Kim	ykim@company.com	ko	user	2	2	2025-04-24 08:20:07.839542	t	f	f	0	\N
9	dmiller	049d0fe5ef15a6015df20e38d1bb5c8580ba0cba8eea3458f315bc33a4803840e43e55e8657efebb27122f4cdb285d0f4d5ec27bfda12fcb7f569293511a145f.287d58f2078b34c2042749877af796f0	David	Miller	dmiller@company.com	en	user	3	3	2025-04-24 08:20:07.88133	t	f	f	0	\N
10	tanderson	0fe3ee2d75faf7115678bfa0290a0b4187b1dcec4131da8813aabfcbba361e1e8c7c7eb19cc5a7b63ae5d9a317f7a93319ac0f34236a21bb30051101e5a3992e.b99dc124ccd82396e29477d567e8a5b9	Tanya	Anderson	tanderson@company.com	en	user	3	3	2025-04-24 08:20:07.92776	t	f	f	0	\N
11	Prestone	8710060600816321d8517e5019033817a00c61e8f221b0616a61305adbbd80704ff18b05c8b7156fa98867eb17c7918ffa73c27bcf79819053b17585675da151.69054830df2fa17e4e17a5024c13c020	Prestone	Otieno	immahpres@gmail.com	en	user	\N	\N	2025-04-24 10:44:34.790398	t	f	f	0	\N
12	bonface.nderitu	c4da6a62a1faa2b6810682421e90f1d3648a50a72dcd8edb22feaf56b83f6ef4e3c795ce47455d3f4fd2888fb35fbe3b6398678bedf66d4bf2a6405aa501f34d.d7711c44ce9cca8711180ef9493db048	Bonface	Nderitu	bonface.nderitu@radioafricagroup.co.ke	en	user	\N	\N	2025-04-29 06:33:56.727126	t	f	f	0	\N
\.


--
-- Name: access_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.access_groups_id_seq', 8, true);


--
-- Name: attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.attachments_id_seq', 1, false);


--
-- Name: badges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.badges_id_seq', 5, true);


--
-- Name: cadences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.cadences_id_seq', 6, true);


--
-- Name: chat_room_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.chat_room_members_id_seq', 25, true);


--
-- Name: chat_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.chat_rooms_id_seq', 6, true);


--
-- Name: check_ins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.check_ins_id_seq', 6, true);


--
-- Name: feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.feedback_id_seq', 6, true);


--
-- Name: highfive_recipients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.highfive_recipients_id_seq', 1, false);


--
-- Name: highfives_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.highfives_id_seq', 1, false);


--
-- Name: initiatives_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.initiatives_id_seq', 6, true);


--
-- Name: key_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.key_results_id_seq', 13, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.messages_id_seq', 14, true);


--
-- Name: objectives_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.objectives_id_seq', 7, true);


--
-- Name: reactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.reactions_id_seq', 1, false);


--
-- Name: teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.teams_id_seq', 6, true);


--
-- Name: timeframes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.timeframes_id_seq', 15, true);


--
-- Name: user_access_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_access_groups_id_seq', 20, true);


--
-- Name: user_badges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_badges_id_seq', 6, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 12, true);


--
-- Name: access_groups access_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.access_groups
    ADD CONSTRAINT access_groups_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- Name: cadences cadences_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cadences
    ADD CONSTRAINT cadences_pkey PRIMARY KEY (id);


--
-- Name: chat_room_members chat_room_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_room_members
    ADD CONSTRAINT chat_room_members_pkey PRIMARY KEY (id);


--
-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (id);


--
-- Name: check_ins check_ins_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.check_ins
    ADD CONSTRAINT check_ins_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: highfive_recipients highfive_recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.highfive_recipients
    ADD CONSTRAINT highfive_recipients_pkey PRIMARY KEY (id);


--
-- Name: highfives highfives_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.highfives
    ADD CONSTRAINT highfives_pkey PRIMARY KEY (id);


--
-- Name: initiatives initiatives_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.initiatives
    ADD CONSTRAINT initiatives_pkey PRIMARY KEY (id);


--
-- Name: key_results key_results_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.key_results
    ADD CONSTRAINT key_results_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: objectives objectives_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.objectives
    ADD CONSTRAINT objectives_pkey PRIMARY KEY (id);


--
-- Name: reactions reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: timeframes timeframes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.timeframes
    ADD CONSTRAINT timeframes_pkey PRIMARY KEY (id);


--
-- Name: user_access_groups user_access_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_access_groups
    ADD CONSTRAINT user_access_groups_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: attachments attachments_message_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_message_id_messages_id_fk FOREIGN KEY (message_id) REFERENCES public.messages(id);


--
-- Name: chat_room_members chat_room_members_chat_room_id_chat_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_room_members
    ADD CONSTRAINT chat_room_members_chat_room_id_chat_rooms_id_fk FOREIGN KEY (chat_room_id) REFERENCES public.chat_rooms(id);


--
-- Name: chat_room_members chat_room_members_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_room_members
    ADD CONSTRAINT chat_room_members_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: chat_rooms chat_rooms_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: check_ins check_ins_key_result_id_key_results_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.check_ins
    ADD CONSTRAINT check_ins_key_result_id_key_results_id_fk FOREIGN KEY (key_result_id) REFERENCES public.key_results(id);


--
-- Name: check_ins check_ins_objective_id_objectives_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.check_ins
    ADD CONSTRAINT check_ins_objective_id_objectives_id_fk FOREIGN KEY (objective_id) REFERENCES public.objectives(id);


--
-- Name: check_ins check_ins_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.check_ins
    ADD CONSTRAINT check_ins_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: feedback feedback_key_result_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_key_result_id_fkey FOREIGN KEY (key_result_id) REFERENCES public.key_results(id);


--
-- Name: feedback feedback_objective_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.objectives(id);


--
-- Name: feedback feedback_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- Name: feedback feedback_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: highfive_recipients highfive_recipients_highfive_id_highfives_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.highfive_recipients
    ADD CONSTRAINT highfive_recipients_highfive_id_highfives_id_fk FOREIGN KEY (highfive_id) REFERENCES public.highfives(id);


--
-- Name: highfive_recipients highfive_recipients_recipient_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.highfive_recipients
    ADD CONSTRAINT highfive_recipients_recipient_id_users_id_fk FOREIGN KEY (recipient_id) REFERENCES public.users(id);


--
-- Name: highfives highfives_key_result_id_key_results_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.highfives
    ADD CONSTRAINT highfives_key_result_id_key_results_id_fk FOREIGN KEY (key_result_id) REFERENCES public.key_results(id);


--
-- Name: highfives highfives_objective_id_objectives_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.highfives
    ADD CONSTRAINT highfives_objective_id_objectives_id_fk FOREIGN KEY (objective_id) REFERENCES public.objectives(id);


--
-- Name: highfives highfives_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.highfives
    ADD CONSTRAINT highfives_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: initiatives initiatives_assigned_to_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.initiatives
    ADD CONSTRAINT initiatives_assigned_to_id_users_id_fk FOREIGN KEY (assigned_to_id) REFERENCES public.users(id);


--
-- Name: initiatives initiatives_key_result_id_key_results_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.initiatives
    ADD CONSTRAINT initiatives_key_result_id_key_results_id_fk FOREIGN KEY (key_result_id) REFERENCES public.key_results(id);


--
-- Name: key_results key_results_assigned_to_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.key_results
    ADD CONSTRAINT key_results_assigned_to_id_users_id_fk FOREIGN KEY (assigned_to_id) REFERENCES public.users(id);


--
-- Name: key_results key_results_objective_id_objectives_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.key_results
    ADD CONSTRAINT key_results_objective_id_objectives_id_fk FOREIGN KEY (objective_id) REFERENCES public.objectives(id);


--
-- Name: messages messages_chat_room_id_chat_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_chat_room_id_chat_rooms_id_fk FOREIGN KEY (chat_room_id) REFERENCES public.chat_rooms(id);


--
-- Name: messages messages_reply_to_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_reply_to_id_messages_id_fk FOREIGN KEY (reply_to_id) REFERENCES public.messages(id);


--
-- Name: messages messages_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: objectives objectives_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.objectives
    ADD CONSTRAINT objectives_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: objectives objectives_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.objectives
    ADD CONSTRAINT objectives_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: objectives objectives_timeframe_id_timeframes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.objectives
    ADD CONSTRAINT objectives_timeframe_id_timeframes_id_fk FOREIGN KEY (timeframe_id) REFERENCES public.timeframes(id);


--
-- Name: reactions reactions_message_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_message_id_messages_id_fk FOREIGN KEY (message_id) REFERENCES public.messages(id);


--
-- Name: reactions reactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: timeframes timeframes_cadence_id_cadences_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.timeframes
    ADD CONSTRAINT timeframes_cadence_id_cadences_id_fk FOREIGN KEY (cadence_id) REFERENCES public.cadences(id);


--
-- Name: user_access_groups user_access_groups_access_group_id_access_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_access_groups
    ADD CONSTRAINT user_access_groups_access_group_id_access_groups_id_fk FOREIGN KEY (access_group_id) REFERENCES public.access_groups(id);


--
-- Name: user_access_groups user_access_groups_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_access_groups
    ADD CONSTRAINT user_access_groups_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_badges user_badges_awarded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_awarded_by_id_fkey FOREIGN KEY (awarded_by_id) REFERENCES public.users(id);


--
-- Name: user_badges user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id);


--
-- Name: user_badges user_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

