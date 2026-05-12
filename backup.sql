--
-- PostgreSQL database dump
--

\restrict pYoQiZvv2Q9Xsy445mZ2tr8aObiIvXAPTmxoo4ZwhbE9NfFy3KrVaKhNIkUNurc

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: myadmin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO myadmin;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: myadmin
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AccountStatus; Type: TYPE; Schema: public; Owner: myadmin
--

CREATE TYPE public."AccountStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);


ALTER TYPE public."AccountStatus" OWNER TO myadmin;

--
-- Name: CoreValueName; Type: TYPE; Schema: public; Owner: myadmin
--

CREATE TYPE public."CoreValueName" AS ENUM (
    'MAKADIYOS',
    'MAKATAO',
    'MAKAKALIKASAN',
    'MAKABANSA'
);


ALTER TYPE public."CoreValueName" OWNER TO myadmin;

--
-- Name: Curriculum; Type: TYPE; Schema: public; Owner: myadmin
--

CREATE TYPE public."Curriculum" AS ENUM (
    'Regular',
    'STE',
    'SPS',
    'SPA',
    'SPJ'
);


ALTER TYPE public."Curriculum" OWNER TO myadmin;

--
-- Name: EnrollmentStatus; Type: TYPE; Schema: public; Owner: myadmin
--

CREATE TYPE public."EnrollmentStatus" AS ENUM (
    'ENROLLED',
    'DROPPED',
    'TRANSFERRED',
    'GRADUATED'
);


ALTER TYPE public."EnrollmentStatus" OWNER TO myadmin;

--
-- Name: EventType; Type: TYPE; Schema: public; Owner: myadmin
--

CREATE TYPE public."EventType" AS ENUM (
    'SCHOOL_EVENT',
    'ACADEMIC_EVENT',
    'COMMUNITY_SERVICE',
    'OTHER'
);


ALTER TYPE public."EventType" OWNER TO myadmin;

--
-- Name: LearningModality; Type: TYPE; Schema: public; Owner: myadmin
--

CREATE TYPE public."LearningModality" AS ENUM (
    'FACE_TO_FACE',
    'DISTANCE_LEARNING',
    'BLENDED',
    'ONLINE',
    'HOMESCHOOL',
    'OTHER'
);


ALTER TYPE public."LearningModality" OWNER TO myadmin;

--
-- Name: QuarterRating; Type: TYPE; Schema: public; Owner: myadmin
--

CREATE TYPE public."QuarterRating" AS ENUM (
    'AO',
    'SO',
    'RO',
    'NO'
);


ALTER TYPE public."QuarterRating" OWNER TO myadmin;

--
-- Name: Region; Type: TYPE; Schema: public; Owner: myadmin
--

CREATE TYPE public."Region" AS ENUM (
    'NCR',
    'CAR',
    'REGION_I',
    'REGION_II',
    'REGION_III',
    'REGION_IV_A',
    'REGION_IV_B',
    'REGION_V',
    'REGION_VI',
    'NIR',
    'REGION_VII',
    'REGION_VIII',
    'REGION_IX',
    'REGION_X',
    'REGION_XI',
    'REGION_XII',
    'REGION_XIII',
    'BARMM'
);


ALTER TYPE public."Region" OWNER TO myadmin;

--
-- Name: SF5ActionTaken; Type: TYPE; Schema: public; Owner: myadmin
--

CREATE TYPE public."SF5ActionTaken" AS ENUM (
    'PROMOTED',
    'CONDITIONAL',
    'RETAINED'
);


ALTER TYPE public."SF5ActionTaken" OWNER TO myadmin;

--
-- Name: SF9GradeItemType; Type: TYPE; Schema: public; Owner: myadmin
--

CREATE TYPE public."SF9GradeItemType" AS ENUM (
    'WRITTEN_WORK',
    'PERFORMANCE_TASK',
    'QUARTERLY_ASSESSMENT'
);


ALTER TYPE public."SF9GradeItemType" OWNER TO myadmin;

--
-- Name: SF9Remarks; Type: TYPE; Schema: public; Owner: myadmin
--

CREATE TYPE public."SF9Remarks" AS ENUM (
    'PASSED',
    'FAILED',
    'INC'
);


ALTER TYPE public."SF9Remarks" OWNER TO myadmin;

--
-- Name: SchoolFormStatus; Type: TYPE; Schema: public; Owner: myadmin
--

CREATE TYPE public."SchoolFormStatus" AS ENUM (
    'DRAFT',
    'GENERATED',
    'SUBMITTED',
    'APPROVED',
    'LOCKED'
);


ALTER TYPE public."SchoolFormStatus" OWNER TO myadmin;

--
-- Name: SchoolFormType; Type: TYPE; Schema: public; Owner: myadmin
--

CREATE TYPE public."SchoolFormType" AS ENUM (
    'SF1',
    'SF5',
    'SF2'
);


ALTER TYPE public."SchoolFormType" OWNER TO myadmin;

--
-- Name: Sex; Type: TYPE; Schema: public; Owner: myadmin
--

CREATE TYPE public."Sex" AS ENUM (
    'MALE',
    'FEMALE'
);


ALTER TYPE public."Sex" OWNER TO myadmin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Admin; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public."Admin" (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    email text NOT NULL,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    name text DEFAULT 'Admin'::text NOT NULL,
    "darkMode" boolean DEFAULT false NOT NULL,
    "emailNotifications" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."Admin" OWNER TO myadmin;

--
-- Name: Admin_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public."Admin_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Admin_id_seq" OWNER TO myadmin;

--
-- Name: Admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public."Admin_id_seq" OWNED BY public."Admin".id;


--
-- Name: Announcement; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public."Announcement" (
    id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "createdById" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Announcement" OWNER TO myadmin;

--
-- Name: Announcement_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public."Announcement_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Announcement_id_seq" OWNER TO myadmin;

--
-- Name: Announcement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public."Announcement_id_seq" OWNED BY public."Announcement".id;


--
-- Name: Event; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public."Event" (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    location text,
    type public."EventType" DEFAULT 'OTHER'::public."EventType" NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "isOnline" boolean DEFAULT false NOT NULL,
    "createdById" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Event" OWNER TO myadmin;

--
-- Name: Event_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public."Event_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Event_id_seq" OWNER TO myadmin;

--
-- Name: Event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public."Event_id_seq" OWNED BY public."Event".id;


--
-- Name: Quarter; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public."Quarter" (
    id integer NOT NULL,
    "schoolYearId" integer NOT NULL,
    name integer NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Quarter" OWNER TO myadmin;

--
-- Name: Quarter_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public."Quarter_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Quarter_id_seq" OWNER TO myadmin;

--
-- Name: Quarter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public."Quarter_id_seq" OWNED BY public."Quarter".id;


--
-- Name: SchoolYear; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public."SchoolYear" (
    id integer NOT NULL,
    label text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isLocked" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."SchoolYear" OWNER TO myadmin;

--
-- Name: SchoolYear_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public."SchoolYear_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SchoolYear_id_seq" OWNER TO myadmin;

--
-- Name: SchoolYear_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public."SchoolYear_id_seq" OWNED BY public."SchoolYear".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO myadmin;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.addresses (
    id integer NOT NULL,
    "studentId" integer NOT NULL,
    "streetAddress" text,
    barangay text,
    "municipalityCity" text,
    province text
);


ALTER TABLE public.addresses OWNER TO myadmin;

--
-- Name: addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.addresses_id_seq OWNER TO myadmin;

--
-- Name: addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.addresses_id_seq OWNED BY public.addresses.id;


--
-- Name: advisers; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.advisers (
    id integer NOT NULL,
    "adviserId" character varying(8) NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "mustChangePassword" boolean DEFAULT true NOT NULL,
    "signatureUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    "contactNumber" text,
    nationality text,
    sex text,
    "darkMode" boolean DEFAULT false NOT NULL,
    "emailNotifications" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.advisers OWNER TO myadmin;

--
-- Name: advisers_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.advisers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.advisers_id_seq OWNER TO myadmin;

--
-- Name: advisers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.advisers_id_seq OWNED BY public.advisers.id;


--
-- Name: core_values; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.core_values (
    id integer NOT NULL,
    name public."CoreValueName" NOT NULL,
    description text
);


ALTER TABLE public.core_values OWNER TO myadmin;

--
-- Name: core_values_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.core_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.core_values_id_seq OWNER TO myadmin;

--
-- Name: core_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.core_values_id_seq OWNED BY public.core_values.id;


--
-- Name: enrollment_learning_areas; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.enrollment_learning_areas (
    id integer NOT NULL,
    "enrollmentId" integer NOT NULL,
    "learningAreaId" integer NOT NULL
);


ALTER TABLE public.enrollment_learning_areas OWNER TO myadmin;

--
-- Name: enrollment_learning_areas_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.enrollment_learning_areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enrollment_learning_areas_id_seq OWNER TO myadmin;

--
-- Name: enrollment_learning_areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.enrollment_learning_areas_id_seq OWNED BY public.enrollment_learning_areas.id;


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.enrollments (
    id integer NOT NULL,
    "studentId" integer NOT NULL,
    "sectionId" integer NOT NULL,
    "schoolYear" text NOT NULL,
    "learningModality" public."LearningModality" NOT NULL,
    status public."EnrollmentStatus" DEFAULT 'ENROLLED'::public."EnrollmentStatus" NOT NULL,
    "enrollmentDate" timestamp(3) without time zone,
    remarks text
);


ALTER TABLE public.enrollments OWNER TO myadmin;

--
-- Name: enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enrollments_id_seq OWNER TO myadmin;

--
-- Name: enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.enrollments_id_seq OWNED BY public.enrollments.id;


--
-- Name: guardians; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.guardians (
    id integer NOT NULL,
    "studentId" integer NOT NULL,
    "fatherFirstName" text,
    "fatherMiddleName" text,
    "fatherLastName" text,
    "motherMaidenFirstName" text,
    "motherMaidenMiddleName" text,
    "motherMaidenLastName" text,
    "guardianName" text,
    "guardianRelationship" text,
    "guardianContactNumber" text
);


ALTER TABLE public.guardians OWNER TO myadmin;

--
-- Name: guardians_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.guardians_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guardians_id_seq OWNER TO myadmin;

--
-- Name: guardians_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.guardians_id_seq OWNED BY public.guardians.id;


--
-- Name: learning_areas; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.learning_areas (
    id integer NOT NULL,
    name text NOT NULL,
    "performanceTaskWeight" double precision DEFAULT 0.5 NOT NULL,
    "quarterlyAssessmentWeight" double precision DEFAULT 0.2 NOT NULL,
    "writtenWorkWeight" double precision DEFAULT 0.3 NOT NULL,
    "gradeLevel" integer DEFAULT 7 NOT NULL,
    curriculum public."Curriculum" DEFAULT 'Regular'::public."Curriculum" NOT NULL,
    "adviserId" integer
);


ALTER TABLE public.learning_areas OWNER TO myadmin;

--
-- Name: learning_areas_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.learning_areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.learning_areas_id_seq OWNER TO myadmin;

--
-- Name: learning_areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.learning_areas_id_seq OWNED BY public.learning_areas.id;


--
-- Name: school_forms; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.school_forms (
    id integer NOT NULL,
    "sectionId" integer NOT NULL,
    "schoolYear" text NOT NULL,
    type public."SchoolFormType" NOT NULL,
    status public."SchoolFormStatus" DEFAULT 'DRAFT'::public."SchoolFormStatus" NOT NULL,
    "generatedAt" timestamp(3) without time zone,
    "submittedAt" timestamp(3) without time zone,
    "approvedAt" timestamp(3) without time zone,
    "lockedAt" timestamp(3) without time zone,
    "generatedBy" integer,
    "approvedBy" integer
);


ALTER TABLE public.school_forms OWNER TO myadmin;

--
-- Name: school_forms_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.school_forms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.school_forms_id_seq OWNER TO myadmin;

--
-- Name: school_forms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.school_forms_id_seq OWNED BY public.school_forms.id;


--
-- Name: schools; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.schools (
    id integer NOT NULL,
    "schoolIdNumber" text NOT NULL,
    "schoolName" text NOT NULL,
    region public."Region" NOT NULL,
    division text NOT NULL,
    district text
);


ALTER TABLE public.schools OWNER TO myadmin;

--
-- Name: schools_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.schools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schools_id_seq OWNER TO myadmin;

--
-- Name: schools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.schools_id_seq OWNED BY public.schools.id;


--
-- Name: sections; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.sections (
    id integer NOT NULL,
    name text NOT NULL,
    "gradeLevel" integer NOT NULL,
    "schoolYear" text NOT NULL,
    curriculum public."Curriculum" DEFAULT 'Regular'::public."Curriculum" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "adviserId" integer,
    "classSize" integer,
    color text,
    schedule jsonb,
    room text
);


ALTER TABLE public.sections OWNER TO myadmin;

--
-- Name: sections_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sections_id_seq OWNER TO myadmin;

--
-- Name: sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.sections_id_seq OWNED BY public.sections.id;


--
-- Name: sf5_reports; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.sf5_reports (
    id integer NOT NULL,
    "studentId" integer NOT NULL,
    "generalAverage" integer,
    "actionTaken" public."SF5ActionTaken" NOT NULL,
    "learningAreasNotMet" text[]
);


ALTER TABLE public.sf5_reports OWNER TO myadmin;

--
-- Name: sf5_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.sf5_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sf5_reports_id_seq OWNER TO myadmin;

--
-- Name: sf5_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.sf5_reports_id_seq OWNED BY public.sf5_reports.id;


--
-- Name: sf9_core_values; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.sf9_core_values (
    id integer NOT NULL,
    "studentId" integer NOT NULL,
    "coreValueId" integer NOT NULL,
    q1 public."QuarterRating",
    q2 public."QuarterRating",
    q3 public."QuarterRating",
    q4 public."QuarterRating"
);


ALTER TABLE public.sf9_core_values OWNER TO myadmin;

--
-- Name: sf9_core_values_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.sf9_core_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sf9_core_values_id_seq OWNER TO myadmin;

--
-- Name: sf9_core_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.sf9_core_values_id_seq OWNED BY public.sf9_core_values.id;


--
-- Name: sf9_grade_items; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.sf9_grade_items (
    id integer NOT NULL,
    "sf9GradeId" integer NOT NULL,
    quarter integer NOT NULL,
    type public."SF9GradeItemType" NOT NULL,
    score double precision NOT NULL,
    "maxScore" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sf9_grade_items OWNER TO myadmin;

--
-- Name: sf9_grade_items_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.sf9_grade_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sf9_grade_items_id_seq OWNER TO myadmin;

--
-- Name: sf9_grade_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.sf9_grade_items_id_seq OWNED BY public.sf9_grade_items.id;


--
-- Name: sf9_grades; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.sf9_grades (
    id integer NOT NULL,
    "studentId" integer NOT NULL,
    "learningAreaId" integer NOT NULL,
    "schoolYear" text NOT NULL,
    q1 integer,
    q2 integer,
    q3 integer,
    q4 integer,
    "finalRating" integer,
    remarks public."SF9Remarks",
    "q1Ready" boolean DEFAULT false NOT NULL,
    "q2Ready" boolean DEFAULT false NOT NULL,
    "q3Ready" boolean DEFAULT false NOT NULL,
    "q4Ready" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.sf9_grades OWNER TO myadmin;

--
-- Name: sf9_grades_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.sf9_grades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sf9_grades_id_seq OWNER TO myadmin;

--
-- Name: sf9_grades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.sf9_grades_id_seq OWNED BY public.sf9_grades.id;


--
-- Name: sf9_summaries; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.sf9_summaries (
    id integer NOT NULL,
    "studentId" integer NOT NULL,
    "schoolYear" text NOT NULL,
    "generalAverage" integer
);


ALTER TABLE public.sf9_summaries OWNER TO myadmin;

--
-- Name: sf9_summaries_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.sf9_summaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sf9_summaries_id_seq OWNER TO myadmin;

--
-- Name: sf9_summaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.sf9_summaries_id_seq OWNED BY public.sf9_summaries.id;


--
-- Name: students; Type: TABLE; Schema: public; Owner: myadmin
--

CREATE TABLE public.students (
    id integer NOT NULL,
    lrn character varying(12) NOT NULL,
    "firstName" text NOT NULL,
    "middleName" text,
    "lastName" text NOT NULL,
    "nameExtension" text,
    sex public."Sex" NOT NULL,
    "birthDate" date,
    "motherTongue" text,
    "ethnicGroup" text,
    religion text,
    email text,
    "createdByAdviserId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.students OWNER TO myadmin;

--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: myadmin
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO myadmin;

--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myadmin
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: Admin id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public."Admin" ALTER COLUMN id SET DEFAULT nextval('public."Admin_id_seq"'::regclass);


--
-- Name: Announcement id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public."Announcement" ALTER COLUMN id SET DEFAULT nextval('public."Announcement_id_seq"'::regclass);


--
-- Name: Event id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public."Event" ALTER COLUMN id SET DEFAULT nextval('public."Event_id_seq"'::regclass);


--
-- Name: Quarter id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public."Quarter" ALTER COLUMN id SET DEFAULT nextval('public."Quarter_id_seq"'::regclass);


--
-- Name: SchoolYear id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public."SchoolYear" ALTER COLUMN id SET DEFAULT nextval('public."SchoolYear_id_seq"'::regclass);


--
-- Name: addresses id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);


--
-- Name: advisers id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.advisers ALTER COLUMN id SET DEFAULT nextval('public.advisers_id_seq'::regclass);


--
-- Name: core_values id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.core_values ALTER COLUMN id SET DEFAULT nextval('public.core_values_id_seq'::regclass);


--
-- Name: enrollment_learning_areas id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.enrollment_learning_areas ALTER COLUMN id SET DEFAULT nextval('public.enrollment_learning_areas_id_seq'::regclass);


--
-- Name: enrollments id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN id SET DEFAULT nextval('public.enrollments_id_seq'::regclass);


--
-- Name: guardians id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.guardians ALTER COLUMN id SET DEFAULT nextval('public.guardians_id_seq'::regclass);


--
-- Name: learning_areas id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.learning_areas ALTER COLUMN id SET DEFAULT nextval('public.learning_areas_id_seq'::regclass);


--
-- Name: school_forms id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.school_forms ALTER COLUMN id SET DEFAULT nextval('public.school_forms_id_seq'::regclass);


--
-- Name: schools id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.schools ALTER COLUMN id SET DEFAULT nextval('public.schools_id_seq'::regclass);


--
-- Name: sections id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sections ALTER COLUMN id SET DEFAULT nextval('public.sections_id_seq'::regclass);


--
-- Name: sf5_reports id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf5_reports ALTER COLUMN id SET DEFAULT nextval('public.sf5_reports_id_seq'::regclass);


--
-- Name: sf9_core_values id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf9_core_values ALTER COLUMN id SET DEFAULT nextval('public.sf9_core_values_id_seq'::regclass);


--
-- Name: sf9_grade_items id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf9_grade_items ALTER COLUMN id SET DEFAULT nextval('public.sf9_grade_items_id_seq'::regclass);


--
-- Name: sf9_grades id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf9_grades ALTER COLUMN id SET DEFAULT nextval('public.sf9_grades_id_seq'::regclass);


--
-- Name: sf9_summaries id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf9_summaries ALTER COLUMN id SET DEFAULT nextval('public.sf9_summaries_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Data for Name: Admin; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public."Admin" (id, username, password, "createdAt", "updatedAt", email, "resetToken", "resetTokenExpiry", name, "darkMode", "emailNotifications") FROM stdin;
1	admin	$2b$10$8pugo08RGrA9vCRhdvDXwO6.ZvQ3URQ2TrjgbXcXmMjQonb/pxUbW	2026-03-29 04:09:26.545	2026-04-17 06:04:31.194	admin@gmail.com	\N	\N	Chris	t	t
2	adrian	$2b$10$loTOBNLu0OO41NwhYFszneAviIDAWnOLgPyG/F3ojfNy50TKEoHD.	2026-05-02 05:35:03.467	2026-05-02 05:36:06.015	adriandominic.tan@wvsu.edu.ph	7a0646d08215d8f013c71cb760f5225366544d1ac11b2e9104bfaea4dd9de90e	2026-05-02 06:36:06.013	Admin	f	t
\.


--
-- Data for Name: Announcement; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public."Announcement" (id, title, content, "publishedAt", "expiresAt", "createdById", "createdAt", "updatedAt") FROM stdin;
5	Midterms	a	1111-11-12 03:07:08	1111-11-12 03:07:08	1	2026-04-20 11:17:15.367	2026-04-20 11:17:15.367
4	Midterm Exams Schedule	Lorem ipsum.dsa	2026-04-16 18:00:00	2026-04-23 18:00:00	1	2026-04-17 06:02:50.605	2026-04-21 04:14:28.127
6	Spring Semester Registration Open	The registration for the Spring semester is now open. Please complete your enrollment by March 15, 2026.	2026-02-28 08:00:00	2026-03-15 23:59:59	1	2026-04-21 09:31:05.406	2026-04-21 09:31:05.406
7	Spring Semester Registration Open	The registration for the Spring semester is now open. Please complete your enrollment by March 15, 2026.	2026-02-28 08:00:00	2026-03-15 23:59:59	1	2026-04-21 09:31:06.012	2026-04-21 09:31:06.012
8	Spring Semester Registration Open	The registration for the Spring semester is now open. Please complete your enrollment by March 15, 2026.	2026-02-28 08:00:00	2026-03-15 23:59:59	1	2026-04-21 09:31:06.56	2026-04-21 09:31:06.56
9	Spring Semester Registration Open	The registration for the Spring semester is now open. Please complete your enrollment by March 15, 2026.	2026-02-28 08:00:00	2026-03-15 23:59:59	1	2026-04-21 09:31:07.061	2026-04-21 09:31:07.061
10	Spring Semester Registration Open	The registration for the Spring semester is now open. Please complete your enrollment by March 15, 2026.	2026-02-28 08:00:00	2026-03-15 23:59:59	1	2026-04-21 09:31:07.488	2026-04-21 09:31:07.488
11	Spring Semester Registration Open	The registration for the Spring semester is now open. Please complete your enrollment by March 15, 2026.	2026-02-28 08:00:00	2026-03-15 23:59:59	1	2026-04-21 09:31:07.989	2026-04-21 09:31:07.989
12	Spring Semester Registration Open	The registration for the Spring semester is now open. Please complete your enrollment by March 15, 2026.	2026-02-28 08:00:00	2026-03-15 23:59:59	1	2026-04-21 09:31:08.476	2026-04-21 09:31:08.476
13	Spring Semester Registration Open	The registration for the Spring semester is now open. Please complete your enrollment by March 15, 2026.	2026-02-28 08:00:00	2026-03-15 23:59:59	1	2026-04-21 09:31:08.93	2026-04-21 09:31:08.93
14	Spring Semester Registration Open	The registration for the Spring semester is now open. Please complete your enrollment by March 15, 2026.	2026-02-28 08:00:00	2026-03-15 23:59:59	1	2026-04-21 09:31:09.448	2026-04-21 09:31:09.448
\.


--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public."Event" (id, title, description, location, type, "startDate", "endDate", "isOnline", "createdById", "createdAt", "updatedAt") FROM stdin;
5	Science Fair	Lorem ipsum.	Gymnasium	SCHOOL_EVENT	2026-04-18 02:00:00	2026-04-30 02:00:00	f	1	2026-04-17 06:03:17.52	2026-04-17 06:03:17.52
6	React Workshop	A full-day workshop covering React fundamentals and hooks.	Room 101, Main Campus	ACADEMIC_EVENT	2026-04-15 09:00:00	2026-04-15 17:00:00	f	1	2026-04-21 09:36:30.535	2026-04-21 09:36:30.535
7	React Workshop	A full-day workshop covering React fundamentals and hooks.	Room 101, Main Campus	ACADEMIC_EVENT	2026-04-15 09:00:00	2026-04-15 17:00:00	f	1	2026-04-21 09:36:31.193	2026-04-21 09:36:31.193
8	React Workshop	A full-day workshop covering React fundamentals and hooks.	Room 101, Main Campus	ACADEMIC_EVENT	2026-04-15 09:00:00	2026-04-15 17:00:00	f	1	2026-04-21 09:36:31.76	2026-04-21 09:36:31.76
9	React Workshop	A full-day workshop covering React fundamentals and hooks.	Room 101, Main Campus	ACADEMIC_EVENT	2026-04-15 09:00:00	2026-04-15 17:00:00	f	1	2026-04-21 09:36:32.28	2026-04-21 09:36:32.28
10	React Workshop	A full-day workshop covering React fundamentals and hooks.	Room 101, Main Campus	ACADEMIC_EVENT	2026-04-15 09:00:00	2026-04-15 17:00:00	f	1	2026-04-21 09:36:32.735	2026-04-21 09:36:32.735
11	React Workshop	A full-day workshop covering React fundamentals and hooks.	Room 101, Main Campus	ACADEMIC_EVENT	2026-04-15 09:00:00	2026-04-15 17:00:00	f	1	2026-04-21 09:36:33.203	2026-04-21 09:36:33.203
12	React Workshop	A full-day workshop covering React fundamentals and hooks.	Room 101, Main Campus	ACADEMIC_EVENT	2026-04-15 09:00:00	2026-04-15 17:00:00	f	1	2026-04-21 09:36:33.647	2026-04-21 09:36:33.647
13	React Workshop	A full-day workshop covering React fundamentals and hooks.	Room 101, Main Campus	ACADEMIC_EVENT	2026-04-15 09:00:00	2026-04-15 17:00:00	f	1	2026-04-21 09:36:34.064	2026-04-21 09:36:34.064
14	React Workshop	A full-day workshop covering React fundamentals and hooks.	Room 101, Main Campus	ACADEMIC_EVENT	2026-04-15 09:00:00	2026-04-15 17:00:00	f	1	2026-04-21 09:36:34.499	2026-04-21 09:36:34.499
\.


--
-- Data for Name: Quarter; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public."Quarter" (id, "schoolYearId", name, "startDate", "endDate") FROM stdin;
5	2	1	2026-03-20 00:00:00	2026-06-19 00:00:00
6	2	2	2026-06-19 00:00:00	2026-09-18 00:00:00
7	2	3	2026-09-18 00:00:00	2026-12-18 00:00:00
8	2	4	2026-12-18 00:00:00	2027-03-19 00:00:00
\.


--
-- Data for Name: SchoolYear; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public."SchoolYear" (id, label, "startDate", "endDate", "isActive", "createdAt", "updatedAt", "isLocked") FROM stdin;
2	2026-2027	2026-05-10 00:00:00	2027-05-10 00:00:00	t	2026-04-29 17:42:30.62	2026-05-10 09:53:29.302	t
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
c1b2f8c4-8ab1-477d-ab35-adbe534f852c	46ecd619ab88a079f4fa4bab7bdbe0d0f56088e76a800cee92b343d8c8bd0e7c	2026-03-29 11:55:41.031763+08	20260321055155_add_adviser_optional_fields	\N	\N	2026-03-29 11:55:41.030942+08	1
3834a02d-b069-4682-b3f2-4456da5405d8	dff9f6f39606de3d9d9179d88917b84b32ba637a6a392e99d5fdb9ba966cd445	2026-03-29 11:55:40.86533+08	20260224031200_init	\N	\N	2026-03-29 11:55:40.840505+08	1
062b9423-9f9b-4a7d-8d0c-816cc50f57f9	ed43a75deceef4c940015897ced7610e77954c046f31370cb49d0d98a44e186a	2026-03-29 11:55:40.993166+08	20260228140810_init	\N	\N	2026-03-29 11:55:40.992382+08	1
b20e7741-ca4d-4c75-910d-0b82ac5c764a	d39e53712cfdfa9569394adbff460a16a586fff84e0c6872ef76a6d6bbea5400	2026-03-29 11:55:40.889842+08	20260227030604_init	\N	\N	2026-03-29 11:55:40.86581+08	1
9d92afa4-b88b-417c-a485-a6227e69f876	c39b3b85e27f773874139ba92178ecaa8499eca2afac1af8ab1a6b57546066ef	2026-03-29 11:55:40.891054+08	20260227035644_init	\N	\N	2026-03-29 11:55:40.89013+08	1
3f531c1e-8c67-44a6-8277-8f4cb198f1ff	9acbf274fcbb111b9bb21db896a634e829b5632fad53bfe9bd61d03534eddffd	2026-03-29 11:55:41.013701+08	20260303013922_init	\N	\N	2026-03-29 11:55:41.012382+08	1
a87dd295-2427-478e-ba97-826353bbd61d	0c1c8b9c67e7355db18f91837a0ac4f6802b7cad2cabd0cd639141107e31b9d4	2026-03-29 11:55:40.901911+08	20260227040226_init	\N	\N	2026-03-29 11:55:40.891307+08	1
9a2c344e-cf9c-4d56-98bd-291a33f25c76	146a44be9a9c30a0ab1c1cb6e12f921ccbb1b88a019730caae6b83aa46e0f1bf	2026-03-29 11:55:40.99465+08	20260302025950_init	\N	\N	2026-03-29 11:55:40.993407+08	1
ffbe2fa1-b1c0-453c-9ccb-8d909a907bfc	6e826428765a0a8d5ba20d5404f2ce53c55582d7bb8c3c5636a7adec9015e6ee	2026-03-29 11:55:40.903981+08	20260227041854_init	\N	\N	2026-03-29 11:55:40.902189+08	1
b662a2ff-c149-40cb-814d-47e48185587f	b392f3ad5f58db40c4e52fc2269ba7d3e369919b1a0e398a6e748dc4b444e78c	2026-03-29 11:55:40.910101+08	20260227042824_init	\N	\N	2026-03-29 11:55:40.904255+08	1
764e2e64-b4db-4efa-a155-8ef662c456d6	c7331bc51a06602ff680f1a82ec145ed514456e89b7ce4528f256b75aaacb097	2026-03-29 11:55:40.91161+08	20260227043054_init	\N	\N	2026-03-29 11:55:40.910354+08	1
e13967a0-1b73-4566-a18f-9e414263222f	2f2c16b2f2fd67f220d26d0347ce7a15347bd3315524e02a997916ef40fe6452	2026-03-29 11:55:40.995564+08	20260302031508_init	\N	\N	2026-03-29 11:55:40.994858+08	1
af05df8f-3439-427c-b1ce-84fa7377ab6e	6c1fcbc81b102cc23ca84803c2d2aa7174e1628bde4a4664f12f020a26e48ed9	2026-03-29 11:55:40.912678+08	20260227055023_init	\N	\N	2026-03-29 11:55:40.911867+08	1
a1a49308-3153-4699-af32-4164039fd6f8	a6c4f6d1310e152c474cfbc3666baac02081eaf2b4fd71cd725dda0e5040fa33	2026-03-29 11:55:40.982571+08	20260227132934_init	\N	\N	2026-03-29 11:55:40.912977+08	1
ef612693-1215-4d69-aa82-cb0e86261003	541ed3ef235b9b0dbdfb70ba73b7ad8088e2363832b383a866034585455963a1	2026-03-29 11:55:41.028504+08	20260319180659_init	\N	\N	2026-03-29 11:55:41.022757+08	1
fdec97b3-075a-46fe-a56c-729019b0177f	96c2d9f37adcd4caccc16085df153e82b46152a71b610350ef01fd8d690cb917	2026-03-29 11:55:40.984332+08	20260228054056_init	\N	\N	2026-03-29 11:55:40.982881+08	1
8a4ea8d5-1eed-425f-a3d1-ec847dbc9bf3	42e6046e16b823d08db18e0aa8d45e791bebca4b8d374dc2da27a9ca0dd58da5	2026-03-29 11:55:40.998626+08	20260302134225_fix_adviser_id	\N	\N	2026-03-29 11:55:40.995814+08	1
5e9b874a-aaf8-4632-868d-b384510acf86	cd88e6b129d6afb5b2e067281fc897625d1cdc823965a3894f3e63863bbe5227	2026-03-29 11:55:40.985424+08	20260228065902_init	\N	\N	2026-03-29 11:55:40.984584+08	1
24bf11e8-45ad-478f-8652-06d8c846146b	930ac2ac39a7d9b5e17a3a7c4edd5cbfc891c96b2e32c85a048686866097fa6a	2026-03-29 11:55:40.989354+08	20260228090116_init	\N	\N	2026-03-29 11:55:40.985651+08	1
60b296f8-9edc-439b-8609-65208c8f7f5f	d3e52fea89e169f0394957ea0727f98cd3f9dc4934f2d806b249bb462fb962fc	2026-03-29 11:55:41.015284+08	20260303021343_init	\N	\N	2026-03-29 11:55:41.013943+08	1
b1af7d6a-617f-4e19-8abd-80161d856b07	2a715c325180925c883c2dfb43054dc0aa9942d6d69a46cc4fdb011c9cb490c5	2026-03-29 11:55:40.990634+08	20260228125508_init	\N	\N	2026-03-29 11:55:40.989616+08	1
2b5acf72-7aa2-4d32-b708-5a053b5d81be	a4182bed790fcae0056dde5a586cfeb66d42da2190d915bf65d1552bf5614352	2026-03-29 11:55:41.004876+08	20260302151033_fix_adviser_id_length	\N	\N	2026-03-29 11:55:40.99886+08	1
ec674385-f893-485b-a0a8-91b8cde82f84	31bc5aaab66607a111e1b2bb1f648f2851af5db527b24cb53279b82eab5dc5d4	2026-03-29 11:55:40.992163+08	20260228125957_init	\N	\N	2026-03-29 11:55:40.990881+08	1
cb0c9f1f-e1e2-49e5-8e4d-291d2df1c796	3c28784556f55b203a7e3529d68c1bbb4b45bd62e5662460c40850d82a281b57	2026-03-29 11:55:41.00846+08	20260302153205_admin	\N	\N	2026-03-29 11:55:41.005126+08	1
cc6d22e7-f962-485f-a937-7ddf25ed3404	89e5997a710cf5985532b7064618ceeed8a8263f299c429a679cedd15eb41b38	2026-03-29 11:55:41.009571+08	20260302161253_role_admin	\N	\N	2026-03-29 11:55:41.008725+08	1
07b26b79-1e63-41a1-83d1-54d539790474	1b70e18119ad70708f48cf44d41640eb437a2263085594c783294b7e2d8cdead	2026-03-29 11:55:41.01639+08	20260316113531_init	\N	\N	2026-03-29 11:55:41.015519+08	1
ec14b202-4ac3-4b14-a431-ae47b6fec3f7	43d486802ce337e87af43f8fe3cf6b57efb98b8f8eb5fb11b4d190960d57ea9e	2026-03-29 11:55:41.010598+08	20260302161613_remove_role_admin	\N	\N	2026-03-29 11:55:41.009823+08	1
a4794aba-b5e4-45ba-870e-ca795a8acf2b	18263f95fa1ef0bc8c8e2b522a40ba3d72c603cf88d144c0b49e9856ec3e313f	2026-03-29 11:55:41.012153+08	20260302162652_admin_emaill	\N	\N	2026-03-29 11:55:41.010821+08	1
e33eb84c-58e9-40be-8716-c3e759605b7f	bb8aa23cde649a9165d468b5132e0818b511be2be4d7fa07e1b0f010ef5c0ff5	2026-03-29 11:55:41.017426+08	20260318042017_init	\N	\N	2026-03-29 11:55:41.016611+08	1
9cbfac7c-7621-464f-87cb-dc3c175badc8	e92db7471425944550c87008f587fbd0d299bf784cba4e3b1a3d7bd0442eb603	2026-03-29 11:55:41.029653+08	20260319181420_init	\N	\N	2026-03-29 11:55:41.028787+08	1
50754d71-853c-410a-9e20-26ac9902fd3c	798e2745c5215a8c929a897b13eb0999a14a0902d2ed2feb5ac00246a7f14c80	2026-03-29 11:55:41.018562+08	20260319173527_init	\N	\N	2026-03-29 11:55:41.017666+08	1
a3f202fa-14f8-476d-a08c-87a3a711a57d	986c08077f91ed5ac4da90b2c917782e724c4c64d9bd685d0a0558916b07ea7d	2026-03-29 11:55:41.022498+08	20260319174212_init	\N	\N	2026-03-29 11:55:41.018783+08	1
d1a2efe7-6dae-4879-979b-ccbe6d0ba93a	cd5126a8824cb92fa2904745bb314a09fb0d8817bebc7a7d4212ba4968161793	2026-03-29 11:55:41.054553+08	20260321160215_admin_name	\N	\N	2026-03-29 11:55:41.053551+08	1
854be8fb-c0bc-40fc-9b64-901254a570a7	036866bc0ccfbff49cf1a771bb5564602c29b6d8755da5933c005ed6d2919ea0	2026-03-29 11:55:41.030714+08	20260320065020_init	\N	\N	2026-03-29 11:55:41.029895+08	1
3b544b17-82e0-4aae-9c24-afbc6f9b0c3c	00f7905ad235c9943cdcc84d48de69b433a59032c9e5463dbdf7d21e87001e7d	2026-03-29 11:55:41.053308+08	20260321150001_remove_sf2_attendance	\N	\N	2026-03-29 11:55:41.043308+08	1
6e41a638-d591-47ca-aa57-faff742c0123	d1e572f1f91ab6c2a273f3dbb290922c0ed84fbf37aae7508bfc21015065d459	2026-03-29 11:55:41.032898+08	20260321062350_add_adviser_settings_fields	\N	\N	2026-03-29 11:55:41.032015+08	1
8eea965a-2bd4-4a9c-868f-343fbbad9d96	bbd5fa9629e9e88b83919a9627407142c49df34e3c3b52b922b0a305755e2f75	2026-03-29 11:55:41.043065+08	20260321092213_school_form	\N	\N	2026-03-29 11:55:41.03313+08	1
d94c89d2-27db-46c1-8307-aed4458cbcec	1e396fc2c90f8272066ebf4ce1089b64e6fbf4b378a6568cdf9c88345ac886ff	2026-03-29 11:55:41.055612+08	20260321180302_add_curriculum	\N	\N	2026-03-29 11:55:41.054801+08	1
78ccaa14-194c-4870-8e8b-dd2a17d36b3c	6644907cd12b3f543c661f8bb43c889e6b641d138aaa1a183ae748b4fdd644ee	2026-03-29 11:55:41.057158+08	20260322024437_learning_area_composite	\N	\N	2026-03-29 11:55:41.055865+08	1
886058a1-a183-451a-b380-e448bb4de8ad	e63e3398a20dea665b6180ff7a0f06c122cedff98c1457e7886c6a0fd1820964	2026-03-29 11:55:41.059342+08	20260322050831_grade_level_learning_area	\N	\N	2026-03-29 11:55:41.057472+08	1
0a823d8b-ec54-4fa2-94bd-c3cf16c3db30	5fc185a653ca653ef775413bdcd00156ec67fd9b191660abe8002b30103c4d03	2026-03-30 22:35:45.703484+08	20260330143545_student_remove_sex_required	\N	\N	2026-03-30 22:35:45.699508+08	1
168f7f55-f025-40a6-8bd4-6615a7b29577	678397bf95447c24a09cc156b4a9335daa58b08bb42cdd0899f7c4ee202b3e5e	2026-04-01 18:56:29.046483+08	20260401105629_admin_add_preferences	\N	\N	2026-04-01 18:56:29.023186+08	1
86d3a61d-6062-43d4-b732-f9496446ad04	99f04773cd6fc386b4986149ca85ddeea4126851711f08b470454bc216b0a8ed	2026-04-02 04:01:21.772062+08	20260401200121_add_announcements_and_events	\N	\N	2026-04-02 04:01:21.667756+08	1
520c3f66-d36b-4419-8fb7-f087a6e6b460	85a3aa9b50e483e1eb0c03a638a552a02a9aa6a88e93193acf21ca4be361533c	2026-04-02 12:08:42.64476+08	20260402040842_section_remove_is_advisory	\N	\N	2026-04-02 12:08:42.62597+08	1
07c2fb67-00a3-4e45-9b4d-35c7e87055ca	c06d8973c1eb47306f0dc76674ea5b198eba7b0cf6b2a549f483a947eba2691d	2026-04-02 12:43:54.098933+08	20260402044354_learning_area_adviser_assigned	\N	\N	2026-04-02 12:43:54.072948+08	1
68f7b9a8-bbdc-4d06-b6df-0908d2b03bcc	ec6affeb949d3f108149f0b65dbb03239955462ebfdc9db532f917dcf31926bf	2026-04-03 09:46:41.208946+08	20260403014641_make_adviser_optional_add_room	\N	\N	2026-04-03 09:46:41.17198+08	1
04a59d26-ca4b-4b17-80f6-cb750ccc73bc	576e58a37e43f51c33e61837fa94be2da643283f5d29ea8f0931b6c9529cc537	2026-04-26 18:04:54.79515+08	20260426100454_add_sf2_schoolformtype	\N	\N	2026-04-26 18:04:54.77721+08	1
caca0a9a-43c4-42fd-b900-681579df1b88	7a3c803b065d22427f50730d447470d53e6751762a3c61ad4e539fceff5369d8	2026-04-29 16:40:53.670813+08	20260429084053_init	\N	\N	2026-04-29 16:40:53.576117+08	1
1e8e2deb-0f08-47d8-a86d-7dd6c9cbbb22	b534f620c2c619ff0e0327e7164e5d45e1647d82873f2dced05b0e1092a57848	2026-04-29 17:11:48.582738+08	20260429091148_init	\N	\N	2026-04-29 17:11:48.563058+08	1
\.


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.addresses (id, "studentId", "streetAddress", barangay, "municipalityCity", province) FROM stdin;
744	1213	\N	BALABAG	PAVIA	ILOILO
745	1214	\N	BALABAG	PAVIA	ILOILO
746	1215	\N	AGANAN	PAVIA	ILOILO
747	1216	\N	BALABAG	PAVIA	ILOILO
748	1217	\N	PUROK I (POB.)	PAVIA	ILOILO
749	1218	\N	PANDAC	PAVIA	ILOILO
750	1219	\N	PUROK I (POB.)	PAVIA	ILOILO
751	1220	\N	BALABAG	PAVIA	ILOILO
752	1221	\N	CABUGAO NORTE	PAVIA	ILOILO
753	1222	\N	TIGUM	PAVIA	ILOILO
754	1223	\N	AGANAN	PAVIA	ILOILO
755	1224	\N	PUROK II (POB.)	PAVIA	ILOILO
756	1225	\N	PUROK IV (POB.)	PAVIA	ILOILO
757	1226	\N	SAN ANTONIO	SAN MIGUEL	ILOILO
758	1227	\N	UNGKA I	PAVIA	ILOILO
759	1228	\N	BALABAG	PAVIA	ILOILO
760	1229	\N	PAGSANGA-AN	PAVIA	ILOILO
761	1230	\N	PANDAC	PAVIA	ILOILO
762	1231	\N	CABUGAO SUR	SANTA BARBARA	ILOILO
763	1232	\N	UNGKA II	PAVIA	ILOILO
764	1233	\N	PUROK IV (POB.)	PAVIA	ILOILO
765	1234	\N	SALVACION	NUEVA VALENCIA	GUIMARAS
766	1235	\N	DA-AN NORTE	TAPAZ	CAPIZ
767	1236	\N	BALABAG	PAVIA	ILOILO
768	1237	\N	PANDAC	PAVIA	ILOILO
769	1238	\N	BALABAG	PAVIA	ILOILO
770	1239	\N	JIBAO-AN	PAVIA	ILOILO
771	1240	\N	JIBAO-AN	PAVIA	ILOILO
772	1241	\N	PUROK II (POB.)	PAVIA	ILOILO
773	1242	\N	ANILAO	PAVIA	ILOILO
774	1243	\N	PANDAC	PAVIA	ILOILO
775	1244	\N	MALI-AO	PAVIA	ILOILO
776	1245	\N	PUROK IV (POB.)	PAVIA	ILOILO
777	1246	\N	BALABAG	SANTA BARBARA	ILOILO
778	1247	\N	UNGKA II	PAVIA	ILOILO
779	1248	\N	TIGUM	PAVIA	ILOILO
780	1249	\N	PANDAC	PAVIA	ILOILO
781	1250	\N	BALABAG	PAVIA	ILOILO
782	1251	\N	PAGSANGA-AN	PAVIA	ILOILO
783	1252	\N	TIGUM	PAVIA	ILOILO
784	1253	\N	CABUGAO SUR	PAVIA	ILOILO
785	1254	\N	UNGKA II	PAVIA	ILOILO
786	1255	\N	BALABAG	PAVIA	ILOILO
787	1256	\N	JIBAO-AN	PAVIA	ILOILO
788	1257	\N	UNGKA I	PAVIA	ILOILO
789	1258	\N	PANDAC	PAVIA	ILOILO
790	1259	\N	UNGKA II	PAVIA	ILOILO
791	1260	\N	PAGSANGA-AN	PAVIA	ILOILO
792	1261	\N	PANDAC	PAVIA	ILOILO
793	1262	\N	PANDAC	PAVIA	ILOILO
794	1263	\N	PANDAC	PAVIA	ILOILO
\.


--
-- Data for Name: advisers; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.advisers (id, "adviserId", name, email, password, "mustChangePassword", "signatureUrl", "createdAt", "updatedAt", "resetToken", "resetTokenExpiry", "contactNumber", nationality, sex, "darkMode", "emailNotifications") FROM stdin;
6	12332112	Skusta Clee	skusta@pnhs.edu.ph	$2b$10$fgfS1g0c90HysIjyxeO9B.vMoi5NdmvhyPn28LO6bSWt5p8hyDMGW	t	\N	2026-04-27 07:43:00.574	2026-04-29 15:04:41.235	\N	\N	\N	\N	MALE	f	t
5	12345678	John Cruz	john@gmail.com	$2b$10$qowRjdbrCXw98EcFpM1neuYvnAZd/iKoJ9nu764ZXtwZx3bZmKt6q	f	\N	2026-04-02 09:06:55.698	2026-04-29 15:05:50.709	\N	\N	\N	\N	MALE	f	f
\.


--
-- Data for Name: core_values; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.core_values (id, name, description) FROM stdin;
\.


--
-- Data for Name: enrollment_learning_areas; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.enrollment_learning_areas (id, "enrollmentId", "learningAreaId") FROM stdin;
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.enrollments (id, "studentId", "sectionId", "schoolYear", "learningModality", status, "enrollmentDate", remarks) FROM stdin;
1309	1213	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1310	1214	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1311	1215	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1312	1216	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1313	1217	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-07-16
1314	1218	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1315	1219	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1316	1220	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1317	1221	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1318	1222	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1319	1223	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1320	1224	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1321	1225	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1322	1226	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16T/O DATE:2025/09/09
1323	1227	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1324	1228	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1325	1229	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1326	1230	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1327	1231	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1328	1232	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1329	1233	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1330	1234	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16T/O DATE:2025/11/14
1331	1235	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1332	1236	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1333	1237	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1334	1238	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1335	1239	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1336	1240	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1337	1241	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1338	1242	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1339	1243	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1340	1244	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1341	1245	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1342	1246	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1343	1247	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1344	1248	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1345	1249	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1346	1250	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1347	1251	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1348	1252	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1349	1253	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1350	1254	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1351	1255	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1352	1256	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1353	1257	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1354	1258	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1355	1259	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1356	1260	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1357	1261	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1358	1262	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
1359	1263	528	2026 - 2027	FACE_TO_FACE	ENROLLED	\N	T/I DATE:2025-06-16
\.


--
-- Data for Name: guardians; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.guardians (id, "studentId", "fatherFirstName", "fatherMiddleName", "fatherLastName", "motherMaidenFirstName", "motherMaidenMiddleName", "motherMaidenLastName", "guardianName", "guardianRelationship", "guardianContactNumber") FROM stdin;
728	1213	Eugene	Juarez Jr	Abanilla	Gracel,Lopez	\N	Tobongbanua	\N	\N	\N
729	1214	Enrico	Tejereso Jr	Arlanza	Ma	Rebecca,Cainglet	Cabar	\N	\N	\N
730	1215	Noel	Silva	Atup	Jenelly,Seriritan	\N	Projillo	\N	\N	\N
731	1216	Gary	Dadivas	Bartonico	Ma	Fe,Jaranilla	Hechanova	\N	\N	\N
732	1217	Domenie	Serrano	Daria	Phine	Olive,Silao	Hachero	\N	\N	\N
733	1218	De	La Cruz Glenn Bryan	Estelles	Emelyn,Latumbo	\N	Caro	\N	\N	\N
734	1219	Marjun	Caballero	Diesto	Corazon,Gumban	\N	Diesto	\N	\N	\N
735	1220	Jojie	Lumampao	Garcia	Reem,Labto	\N	Berondo	\N	\N	\N
736	1221	Denmark	Placente	Gerono	Shella,Jabao	\N	Caro	\N	\N	\N
737	1222	Roger	Gagante	Guillem	Vivian,Gapasinao	\N	Dana	\N	\N	\N
738	1223	Roeylito	Ocana	Gumban	Ronna,Berte	\N	Rendon	\N	\N	\N
739	1224	Ramel	Adona	Hallara	Divina,Famillaran	\N	Cadicoy	\N	\N	\N
740	1225	Jimboy	Gregori	Ibañez	Verallo,Sacarez	\N	Jeniza	\N	\N	\N
741	1226	Rhezztti	Joe Ejar	Inefable	Hazel,Talibutab	\N	Jomento	\N	\N	\N
742	1227	Eduardo	Aniversario	Maciado	Jenny,Oñate	\N	Alfaro	\N	\N	\N
743	1228	Angelo	Provido	Mones	Nelia,Castor	\N	Caro	\N	\N	\N
744	1229	Alberto	Panes	Montuya	Anelen,Siong	\N	Talabong	\N	\N	\N
745	1230	Wilmer	Montua	Nomos	Ma	Angelie Ann,Sangcada	Billena	\N	\N	\N
746	1231	John	Gonzales	Osano	Liezl,Parquin	\N	Gastar	\N	\N	\N
747	1232	Richard	Romeo	Perdenia	Susie,Parcullo	\N	Saberon	\N	\N	\N
748	1233	Rashid	-	Qadeer	Rhea,Real	\N	Dalipe	\N	\N	\N
749	1234	Jayvon	Galvan	Segovia	Maichel,Dela	Liña	Faburada	\N	\N	\N
750	1235	Joey	Linda	Sollano	Flossie,Pilada	\N	Ba-At	\N	\N	\N
751	1236	Arlick	Gallaron	Victoriano	Nancy,Jinio	\N	Poral	\N	\N	\N
752	1237	John	Paul Tonogbanua	Villaluna	Resan,Basilio	\N	Lusanta	\N	\N	\N
753	1238	Marlon	Aldabon	Ablanido	June	Criselle,Madero	Lloren	\N	\N	\N
754	1239	Arnold	Maramag	Banatao	Bernette,De	Capillo	Capre	\N	\N	\N
755	1240	Reynante	Alviola	Bellera	Medelyne,Galvez	\N	Ferrer	\N	\N	\N
756	1241	Joseph	Bryan Abellada	Cardiente	Novelyn,Constantino	\N	Bade	\N	\N	\N
757	1242	Jonathan	Carisma	Casaquite	Rhea	Joy,Tan	Testigo	\N	\N	\N
758	1243	Delos	Santos Nilo Salcedo	Jr	Mary	Grace,Rivera	Herrera	\N	\N	\N
759	1244	Felix	Cadeño	Dulapo	Berna	Jane,Gayanelo	Diana	\N	\N	\N
760	1245	Ernesto	Cabayao	Galbizo	Rebecca,Tuyogon	\N	Salaum	\N	\N	\N
761	1246	Jasper	Cahong	Gerada	Govelyn,Sabidong	\N	Parreño	\N	\N	\N
762	1247	Nestor	Lama	Glorial	Mary	Jane,Villanueva	Bacalangco	\N	\N	\N
763	1248	Sherwin	Villarma	Gobuyan	Desiree,Lozada	\N	Gobuyan	\N	\N	\N
764	1249	Erwin	Campanel	Hubernadas	Mary	Ann,Herradura	Toreno	\N	\N	\N
765	1250	Ariel	Miro	Jadulan	Jessica,Jaen	\N	Gumban	\N	\N	\N
766	1251	Jay	Mark Jadera	Jovero	Claudette	Gay,Tayco	Gocela	\N	\N	\N
767	1252	Abelardo	Legaspi	Larroza	Cory,Bero	\N	Mecmec	\N	\N	\N
768	1253	Victorino	Betita Jr	Mandar	Marilou,Aurecencia	\N	Febrada	\N	\N	\N
769	1254	Marlon	Gonzales	Mañez	Lovella,Bartolome	\N	Alvarado	\N	\N	\N
770	1255	Rechie	John Subang	Mecha	Cathleya,Villanueva	\N	Lazaro	\N	\N	\N
771	1256	Arle	Jumeras	Mirador	Khryss,Romero	\N	Otian	\N	\N	\N
772	1257	John	Japheth Garduque	Noble	Cherry	Mae,Junsay	Abellar	\N	\N	\N
773	1258	Enrique	Tanaleon	Pedregosa	Merlinda,Angelada	\N	Janolino	\N	\N	\N
774	1259	Michel	Gentil	Sinopera	De	Castro Ma Realou	Parreño	\N	\N	\N
775	1260	Alvin	Sabuero	Sopena	April,Balayo	\N	Dionisio	\N	\N	\N
776	1261	Graciano	Sodoysodoy	Suficiencia	De	La Cruz Maricel	Bonotano	\N	\N	\N
777	1262	John	Mark Bolaños	Tamayo	Ana	Leizl,Tolomea	Pitulan	\N	\N	\N
778	1263	Aly	Albito	Timbancaya	Estela,Angelada	\N	Janolino	\N	\N	\N
\.


--
-- Data for Name: learning_areas; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.learning_areas (id, name, "performanceTaskWeight", "quarterlyAssessmentWeight", "writtenWorkWeight", "gradeLevel", curriculum, "adviserId") FROM stdin;
85	Filipino	0.5	0.2	0.3	8	SPA	\N
21	Filipino	0.5	0.2	0.3	7	Regular	\N
22	English	0.5	0.2	0.3	7	Regular	\N
23	Mathematics	0.4	0.2	0.4	7	Regular	\N
24	Science	0.4	0.2	0.4	7	Regular	\N
25	Araling Panlipunan	0.5	0.2	0.3	7	Regular	\N
26	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	7	Regular	\N
27	MAPEH	0.6	0.2	0.2	7	Regular	\N
28	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	7	Regular	\N
29	Filipino	0.5	0.2	0.3	7	SPA	\N
30	English	0.5	0.2	0.3	7	SPA	\N
31	Mathematics	0.4	0.2	0.4	7	SPA	\N
32	Science	0.4	0.2	0.4	7	SPA	\N
33	Araling Panlipunan	0.5	0.2	0.3	7	SPA	\N
34	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	7	SPA	\N
35	MAPEH	0.6	0.2	0.2	7	SPA	\N
36	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	7	SPA	\N
37	Visual Arts	0.6	0.2	0.2	7	SPA	\N
38	Filipino	0.5	0.2	0.3	7	STE	\N
39	English	0.5	0.2	0.3	7	STE	\N
40	Mathematics	0.4	0.2	0.4	7	STE	\N
41	Science	0.4	0.2	0.4	7	STE	\N
42	Araling Panlipunan	0.5	0.2	0.3	7	STE	\N
43	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	7	STE	\N
44	MAPEH	0.6	0.2	0.2	7	STE	\N
45	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	7	STE	\N
46	Environmental Science	0.4	0.2	0.4	7	STE	\N
47	Research I	0.5	0.2	0.3	7	STE	\N
48	Filipino	0.5	0.2	0.3	7	SPS	\N
49	English	0.5	0.2	0.3	7	SPS	\N
50	Mathematics	0.4	0.2	0.4	7	SPS	\N
51	Science	0.4	0.2	0.4	7	SPS	\N
52	Araling Panlipunan	0.5	0.2	0.3	7	SPS	\N
53	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	7	SPS	\N
54	MAPEH	0.6	0.2	0.2	7	SPS	\N
55	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	7	SPS	\N
56	Badminton	0.6	0.2	0.2	7	SPS	\N
57	Filipino	0.5	0.2	0.3	7	SPJ	\N
58	English	0.5	0.2	0.3	7	SPJ	\N
59	Mathematics	0.4	0.2	0.4	7	SPJ	\N
60	Science	0.4	0.2	0.4	7	SPJ	\N
61	Araling Panlipunan	0.5	0.2	0.3	7	SPJ	\N
62	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	7	SPJ	\N
63	MAPEH	0.6	0.2	0.2	7	SPJ	\N
64	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	7	SPJ	\N
65	ICT	0.5	0.2	0.3	7	SPJ	\N
66	Journalism	0.5	0.2	0.3	7	SPJ	\N
67	Filipino	0.5	0.2	0.3	8	Regular	\N
68	English	0.5	0.2	0.3	8	Regular	\N
69	Mathematics	0.4	0.2	0.4	8	Regular	\N
70	Science	0.4	0.2	0.4	8	Regular	\N
71	Araling Panlipunan	0.5	0.2	0.3	8	Regular	\N
72	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	8	Regular	\N
73	MAPEH	0.6	0.2	0.2	8	Regular	\N
74	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	8	Regular	\N
75	Filipino	0.5	0.2	0.3	8	STE	\N
76	English	0.5	0.2	0.3	8	STE	\N
77	Mathematics	0.4	0.2	0.4	8	STE	\N
78	Science	0.4	0.2	0.4	8	STE	\N
79	Araling Panlipunan	0.5	0.2	0.3	8	STE	\N
80	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	8	STE	\N
81	MAPEH	0.6	0.2	0.2	8	STE	\N
82	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	8	STE	\N
83	Biotechnology	0.4	0.2	0.4	8	STE	\N
84	Research II	0.5	0.2	0.3	8	STE	\N
86	English	0.5	0.2	0.3	8	SPA	\N
87	Mathematics	0.4	0.2	0.4	8	SPA	\N
88	Science	0.4	0.2	0.4	8	SPA	\N
89	Araling Panlipunan	0.5	0.2	0.3	8	SPA	\N
90	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	8	SPA	\N
91	MAPEH	0.6	0.2	0.2	8	SPA	\N
92	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	8	SPA	\N
93	Visual Arts	0.6	0.2	0.2	8	SPA	\N
94	Filipino	0.5	0.2	0.3	8	SPJ	\N
95	English	0.5	0.2	0.3	8	SPJ	\N
96	Mathematics	0.4	0.2	0.4	8	SPJ	\N
97	Science	0.4	0.2	0.4	8	SPJ	\N
98	Araling Panlipunan	0.5	0.2	0.3	8	SPJ	\N
99	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	8	SPJ	\N
100	MAPEH	0.6	0.2	0.2	8	SPJ	\N
101	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	8	SPJ	\N
102	ICT	0.5	0.2	0.3	8	SPJ	\N
103	Journalism	0.5	0.2	0.3	8	SPJ	\N
104	Filipino	0.5	0.2	0.3	8	SPS	\N
105	English	0.5	0.2	0.3	8	SPS	\N
106	Mathematics	0.4	0.2	0.4	8	SPS	\N
107	Science	0.4	0.2	0.4	8	SPS	\N
108	Araling Panlipunan	0.5	0.2	0.3	8	SPS	\N
109	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	8	SPS	\N
110	MAPEH	0.6	0.2	0.2	8	SPS	\N
111	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	8	SPS	\N
112	Badminton	0.6	0.2	0.2	8	SPS	\N
113	Filipino	0.5	0.2	0.3	9	Regular	\N
114	English	0.5	0.2	0.3	9	Regular	\N
115	Mathematics	0.4	0.2	0.4	9	Regular	\N
116	Science	0.4	0.2	0.4	9	Regular	\N
117	Araling Panlipunan	0.5	0.2	0.3	9	Regular	\N
118	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	9	Regular	\N
119	MAPEH	0.6	0.2	0.2	9	Regular	\N
120	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	9	Regular	\N
121	Filipino	0.5	0.2	0.3	9	SPS	\N
122	English	0.5	0.2	0.3	9	SPS	\N
123	Mathematics	0.4	0.2	0.4	9	SPS	\N
124	Science	0.4	0.2	0.4	9	SPS	\N
125	Araling Panlipunan	0.5	0.2	0.3	9	SPS	\N
126	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	9	SPS	\N
127	MAPEH	0.6	0.2	0.2	9	SPS	\N
128	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	9	SPS	\N
129	Badminton	0.6	0.2	0.2	9	SPS	\N
130	Filipino	0.5	0.2	0.3	9	SPJ	\N
131	English	0.5	0.2	0.3	9	SPJ	\N
132	Mathematics	0.4	0.2	0.4	9	SPJ	\N
133	Science	0.4	0.2	0.4	9	SPJ	\N
134	Araling Panlipunan	0.5	0.2	0.3	9	SPJ	\N
135	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	9	SPJ	\N
136	MAPEH	0.6	0.2	0.2	9	SPJ	\N
137	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	9	SPJ	\N
138	ICT	0.5	0.2	0.3	9	SPJ	\N
139	Journalism	0.5	0.2	0.3	9	SPJ	\N
140	Filipino	0.5	0.2	0.3	9	STE	\N
141	English	0.5	0.2	0.3	9	STE	\N
142	Mathematics	0.4	0.2	0.4	9	STE	\N
143	Science	0.4	0.2	0.4	9	STE	\N
144	Araling Panlipunan	0.5	0.2	0.3	9	STE	\N
145	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	9	STE	\N
146	MAPEH	0.6	0.2	0.2	9	STE	\N
147	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	9	STE	\N
149	Research III	0.5	0.2	0.3	9	STE	\N
150	Filipino	0.5	0.2	0.3	9	SPA	\N
151	English	0.5	0.2	0.3	9	SPA	\N
152	Mathematics	0.4	0.2	0.4	9	SPA	\N
153	Science	0.4	0.2	0.4	9	SPA	\N
154	Araling Panlipunan	0.5	0.2	0.3	9	SPA	\N
155	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	9	SPA	\N
156	MAPEH	0.6	0.2	0.2	9	SPA	\N
157	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	9	SPA	\N
158	Visual Arts	0.6	0.2	0.2	9	SPA	\N
159	Filipino	0.5	0.2	0.3	10	Regular	\N
160	English	0.5	0.2	0.3	10	Regular	\N
161	Mathematics	0.4	0.2	0.4	10	Regular	\N
162	Science	0.4	0.2	0.4	10	Regular	\N
163	Araling Panlipunan	0.5	0.2	0.3	10	Regular	\N
164	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	10	Regular	\N
165	MAPEH	0.6	0.2	0.2	10	Regular	\N
166	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	10	Regular	\N
167	Filipino	0.5	0.2	0.3	10	SPA	\N
168	English	0.5	0.2	0.3	10	SPA	\N
169	Mathematics	0.4	0.2	0.4	10	SPA	\N
170	Science	0.4	0.2	0.4	10	SPA	\N
171	Araling Panlipunan	0.5	0.2	0.3	10	SPA	\N
172	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	10	SPA	\N
173	MAPEH	0.6	0.2	0.2	10	SPA	\N
174	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	10	SPA	\N
175	Visual Arts	0.6	0.2	0.2	10	SPA	\N
176	Filipino	0.5	0.2	0.3	10	SPJ	\N
177	English	0.5	0.2	0.3	10	SPJ	\N
178	Mathematics	0.4	0.2	0.4	10	SPJ	\N
179	Science	0.4	0.2	0.4	10	SPJ	\N
180	Araling Panlipunan	0.5	0.2	0.3	10	SPJ	\N
181	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	10	SPJ	\N
182	MAPEH	0.6	0.2	0.2	10	SPJ	\N
183	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	10	SPJ	\N
184	ICT	0.5	0.2	0.3	10	SPJ	\N
185	Journalism	0.5	0.2	0.3	10	SPJ	\N
186	Filipino	0.5	0.2	0.3	10	STE	\N
187	English	0.5	0.2	0.3	10	STE	\N
188	Mathematics	0.4	0.2	0.4	10	STE	\N
189	Science	0.4	0.2	0.4	10	STE	\N
190	Araling Panlipunan	0.5	0.2	0.3	10	STE	\N
191	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	10	STE	\N
192	MAPEH	0.6	0.2	0.2	10	STE	\N
193	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	10	STE	\N
194	Electronics	0.4	0.2	0.4	10	STE	\N
195	Research IV	0.5	0.2	0.3	10	STE	\N
196	Filipino	0.5	0.2	0.3	10	SPS	\N
197	English	0.5	0.2	0.3	10	SPS	\N
198	Mathematics	0.4	0.2	0.4	10	SPS	\N
199	Science	0.4	0.2	0.4	10	SPS	\N
200	Araling Panlipunan	0.5	0.2	0.3	10	SPS	\N
201	Edukasyon sa Pagpapakatao	0.5	0.2	0.3	10	SPS	\N
202	MAPEH	0.6	0.2	0.2	10	SPS	\N
203	Edukasyong Pantahanan at Pangkabuhayan	0.6	0.2	0.2	10	SPS	\N
204	Badminton	0.6	0.2	0.2	10	SPS	\N
148	Applied Chemistry	0.4	0.2	0.4	9	STE	6
\.


--
-- Data for Name: school_forms; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.school_forms (id, "sectionId", "schoolYear", type, status, "generatedAt", "submittedAt", "approvedAt", "lockedAt", "generatedBy", "approvedBy") FROM stdin;
1491	527	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1492	527	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1493	527	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1494	528	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1495	528	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1496	528	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1497	529	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1498	529	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1499	529	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1500	530	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1501	530	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1502	530	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1503	531	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1504	531	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1505	531	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1506	532	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1507	532	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1508	532	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1509	533	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1510	533	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1511	533	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1512	534	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1513	534	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1514	534	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1515	535	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1516	535	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1517	535	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1518	536	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1519	536	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1520	536	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1521	537	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1522	537	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1523	537	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1524	538	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1525	538	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1526	538	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1527	539	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1528	539	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1529	539	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1530	540	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1531	540	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1532	540	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1533	541	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1534	541	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1535	541	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1536	542	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1537	542	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1538	542	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1539	543	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1540	543	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1541	543	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1542	544	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1543	544	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1544	544	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1545	545	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1546	545	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1547	545	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1548	546	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1549	546	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1550	546	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1551	547	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1552	547	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1553	547	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1554	548	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1555	548	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1556	548	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1557	549	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1558	549	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1559	549	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1560	550	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1561	550	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1562	550	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1563	551	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1564	551	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1565	551	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1566	552	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1567	552	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1568	552	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1569	553	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1570	553	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1571	553	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1572	554	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1573	554	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1574	554	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1575	555	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1576	555	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1577	555	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1578	556	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1579	556	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1580	556	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1581	557	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1582	557	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1583	557	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1584	558	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1585	558	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1586	558	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1587	559	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1588	559	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1589	559	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1590	560	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1591	560	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1592	560	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1593	561	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1594	561	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1595	561	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1596	562	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1597	562	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1598	562	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1599	563	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1600	563	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1601	563	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1602	564	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1603	564	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1604	564	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1605	565	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1606	565	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1607	565	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1608	566	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1609	566	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1610	566	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1611	567	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1612	567	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1613	567	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1614	568	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1615	568	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1616	568	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1617	569	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1618	569	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1619	569	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1620	570	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1621	570	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1622	570	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1623	571	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1624	571	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1625	571	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1626	572	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1627	572	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1628	572	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1629	573	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1630	573	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1631	573	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1632	574	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1633	574	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1634	574	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1635	575	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1636	575	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1637	575	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1638	576	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1639	576	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1640	576	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1641	577	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1642	577	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1643	577	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1644	578	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1645	578	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1646	578	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1647	579	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1648	579	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1649	579	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1650	580	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1651	580	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1652	580	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1653	581	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1654	581	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1655	581	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1656	582	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1657	582	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1658	582	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1659	583	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1660	583	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1661	583	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1662	584	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1663	584	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1664	584	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1665	585	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1666	585	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1667	585	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1668	586	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1669	586	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1670	586	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1671	587	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1672	587	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1673	587	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1674	588	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1675	588	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1676	588	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1677	589	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1678	589	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1679	589	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1680	590	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1681	590	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1682	590	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1683	591	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1684	591	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1685	591	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1686	592	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1687	592	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1688	592	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1689	593	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1690	593	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1691	593	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1692	594	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1693	594	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1694	594	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1695	595	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1696	595	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1697	595	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1698	596	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1699	596	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1700	596	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1701	597	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1702	597	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1703	597	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1704	598	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1705	598	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1706	598	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1707	599	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1708	599	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1709	599	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1710	600	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1711	600	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1712	600	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1713	601	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1714	601	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1715	601	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1716	602	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1717	602	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1718	602	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1719	603	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1720	603	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1721	603	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1722	604	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1723	604	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1724	604	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1725	605	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1726	605	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1727	605	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1728	606	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1729	606	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1730	606	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1731	607	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1732	607	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1733	607	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1734	608	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1735	608	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1736	608	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1737	609	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1738	609	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1739	609	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1740	610	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1741	610	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1742	610	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1743	611	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1744	611	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1745	611	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1746	612	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1747	612	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1748	612	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
1749	613	2026 - 2027	SF1	DRAFT	\N	\N	\N	\N	\N	\N
1750	613	2026 - 2027	SF2	DRAFT	\N	\N	\N	\N	\N	\N
1751	613	2026 - 2027	SF5	DRAFT	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.schools (id, "schoolIdNumber", "schoolName", region, division, district) FROM stdin;
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.sections (id, name, "gradeLevel", "schoolYear", curriculum, "createdAt", "updatedAt", "adviserId", "classSize", color, schedule, room) FROM stdin;
527	Archernar	7	2026 - 2027	Regular	2026-04-29 17:58:50.543	2026-04-29 17:58:50.543	\N	\N	var(--color-blue-100)	\N	\N
529	Alkaid	7	2026 - 2027	Regular	2026-04-29 17:58:50.559	2026-04-29 17:58:50.559	\N	\N	var(--color-blue-100)	\N	\N
530	Altair	7	2026 - 2027	Regular	2026-04-29 17:58:50.56	2026-04-29 17:58:50.56	\N	\N	var(--color-blue-100)	\N	\N
531	Arcturus	7	2026 - 2027	Regular	2026-04-29 17:58:50.561	2026-04-29 17:58:50.561	\N	\N	var(--color-blue-100)	\N	\N
532	Ascella	7	2026 - 2027	Regular	2026-04-29 17:58:50.562	2026-04-29 17:58:50.562	\N	\N	var(--color-blue-100)	\N	\N
533	Capella	7	2026 - 2027	Regular	2026-04-29 17:58:50.563	2026-04-29 17:58:50.563	\N	\N	var(--color-blue-100)	\N	\N
534	Deneb	7	2026 - 2027	Regular	2026-04-29 17:58:50.564	2026-04-29 17:58:50.564	\N	\N	var(--color-blue-100)	\N	\N
535	Draco	7	2026 - 2027	SPA	2026-04-29 17:58:50.566	2026-04-29 17:58:50.566	\N	\N	var(--color-blue-100)	\N	\N
536	Lyra	7	2026 - 2027	STE	2026-04-29 17:58:50.567	2026-04-29 17:58:50.567	\N	\N	var(--color-blue-200)	\N	\N
537	Mira	7	2026 - 2027	Regular	2026-04-29 17:58:50.568	2026-04-29 17:58:50.568	\N	\N	var(--color-blue-100)	\N	\N
538	Orion	7	2026 - 2027	STE	2026-04-29 17:58:50.57	2026-04-29 17:58:50.57	\N	\N	var(--color-blue-200)	\N	\N
539	Perseus	7	2026 - 2027	SPS	2026-04-29 17:58:50.571	2026-04-29 17:58:50.571	\N	\N	var(--color-blue-300)	\N	\N
540	Phoenix	7	2026 - 2027	Regular	2026-04-29 17:58:50.572	2026-04-29 17:58:50.572	\N	\N	var(--color-blue-100)	\N	\N
541	Polaris	7	2026 - 2027	SPJ	2026-04-29 17:58:50.573	2026-04-29 17:58:50.573	\N	\N	var(--color-blue-200)	\N	\N
542	Regulus	7	2026 - 2027	Regular	2026-04-29 17:58:50.574	2026-04-29 17:58:50.574	\N	\N	var(--color-blue-100)	\N	\N
543	Rigel	7	2026 - 2027	Regular	2026-04-29 17:58:50.574	2026-04-29 17:58:50.574	\N	\N	var(--color-blue-100)	\N	\N
544	Saiph	7	2026 - 2027	Regular	2026-04-29 17:58:50.576	2026-04-29 17:58:50.576	\N	\N	var(--color-blue-100)	\N	\N
545	Sirius	7	2026 - 2027	Regular	2026-04-29 17:58:50.576	2026-04-29 17:58:50.576	\N	\N	var(--color-blue-100)	\N	\N
546	Spica	7	2026 - 2027	Regular	2026-04-29 17:58:50.577	2026-04-29 17:58:50.577	\N	\N	var(--color-blue-100)	\N	\N
547	Vega	7	2026 - 2027	Regular	2026-04-29 17:58:50.578	2026-04-29 17:58:50.578	\N	\N	var(--color-blue-100)	\N	\N
548	Zania	7	2026 - 2027	Regular	2026-04-29 17:58:50.579	2026-04-29 17:58:50.579	\N	\N	var(--color-blue-100)	\N	\N
549	Anthurium	8	2026 - 2027	Regular	2026-04-29 17:58:50.58	2026-04-29 17:58:50.58	\N	\N	var(--color-orange-100)	\N	\N
550	Asphodel	8	2026 - 2027	Regular	2026-04-29 17:58:50.581	2026-04-29 17:58:50.581	\N	\N	var(--color-orange-100)	\N	\N
551	Aster	8	2026 - 2027	STE	2026-04-29 17:58:50.582	2026-04-29 17:58:50.582	\N	\N	var(--color-orange-200)	\N	\N
552	Begonia	8	2026 - 2027	Regular	2026-04-29 17:58:50.583	2026-04-29 17:58:50.583	\N	\N	var(--color-orange-100)	\N	\N
553	Bluebell	8	2026 - 2027	Regular	2026-04-29 17:58:50.584	2026-04-29 17:58:50.584	\N	\N	var(--color-orange-100)	\N	\N
554	Camellia	8	2026 - 2027	STE	2026-04-29 17:58:50.585	2026-04-29 17:58:50.585	\N	\N	var(--color-orange-200)	\N	\N
555	Carnation	8	2026 - 2027	Regular	2026-04-29 17:58:50.587	2026-04-29 17:58:50.587	\N	\N	var(--color-orange-100)	\N	\N
556	Daffodil	8	2026 - 2027	Regular	2026-04-29 17:58:50.588	2026-04-29 17:58:50.588	\N	\N	var(--color-orange-100)	\N	\N
557	Edelweiss	8	2026 - 2027	Regular	2026-04-29 17:58:50.589	2026-04-29 17:58:50.589	\N	\N	var(--color-orange-100)	\N	\N
558	Hyacinth	8	2026 - 2027	Regular	2026-04-29 17:58:50.59	2026-04-29 17:58:50.59	\N	\N	var(--color-orange-100)	\N	\N
559	Iris	8	2026 - 2027	Regular	2026-04-29 17:58:50.591	2026-04-29 17:58:50.591	\N	\N	var(--color-orange-100)	\N	\N
560	Ixora	8	2026 - 2027	Regular	2026-04-29 17:58:50.592	2026-04-29 17:58:50.592	\N	\N	var(--color-orange-100)	\N	\N
561	Jasmine	8	2026 - 2027	Regular	2026-04-29 17:58:50.593	2026-04-29 17:58:50.593	\N	\N	var(--color-orange-100)	\N	\N
562	Lavender	8	2026 - 2027	Regular	2026-04-29 17:58:50.594	2026-04-29 17:58:50.594	\N	\N	var(--color-orange-100)	\N	\N
563	Lily	8	2026 - 2027	Regular	2026-04-29 17:58:50.595	2026-04-29 17:58:50.595	\N	\N	var(--color-orange-100)	\N	\N
564	Mallow	8	2026 - 2027	SPA	2026-04-29 17:58:50.596	2026-04-29 17:58:50.596	\N	\N	var(--color-orange-100)	\N	\N
565	Peony	8	2026 - 2027	SPJ	2026-04-29 17:58:50.597	2026-04-29 17:58:50.597	\N	\N	var(--color-orange-200)	\N	\N
566	Rose	8	2026 - 2027	Regular	2026-04-29 17:58:50.598	2026-04-29 17:58:50.598	\N	\N	var(--color-orange-100)	\N	\N
567	Sampaguita	8	2026 - 2027	Regular	2026-04-29 17:58:50.599	2026-04-29 17:58:50.599	\N	\N	var(--color-orange-100)	\N	\N
568	Stargazer	8	2026 - 2027	Regular	2026-04-29 17:58:50.6	2026-04-29 17:58:50.6	\N	\N	var(--color-orange-100)	\N	\N
569	Trillium	8	2026 - 2027	SPS	2026-04-29 17:58:50.601	2026-04-29 17:58:50.601	\N	\N	var(--color-orange-300)	\N	\N
570	Zinnia	8	2026 - 2027	Regular	2026-04-29 17:58:50.602	2026-04-29 17:58:50.602	\N	\N	var(--color-orange-100)	\N	\N
571	Benevolence	9	2026 - 2027	Regular	2026-04-29 17:58:50.603	2026-04-29 17:58:50.603	\N	\N	var(--color-green-100)	\N	\N
572	Charity	9	2026 - 2027	Regular	2026-04-29 17:58:50.604	2026-04-29 17:58:50.604	\N	\N	var(--color-green-100)	\N	\N
573	Chastity	9	2026 - 2027	Regular	2026-04-29 17:58:50.605	2026-04-29 17:58:50.605	\N	\N	var(--color-green-100)	\N	\N
574	Compassion	9	2026 - 2027	Regular	2026-04-29 17:58:50.606	2026-04-29 17:58:50.606	\N	\N	var(--color-green-100)	\N	\N
575	Courage	9	2026 - 2027	SPS	2026-04-29 17:58:50.607	2026-04-29 17:58:50.607	\N	\N	var(--color-green-300)	\N	\N
576	Creativity	9	2026 - 2027	SPJ	2026-04-29 17:58:50.608	2026-04-29 17:58:50.608	\N	\N	var(--color-green-200)	\N	\N
577	Faith	9	2026 - 2027	Regular	2026-04-29 17:58:50.609	2026-04-29 17:58:50.609	\N	\N	var(--color-green-100)	\N	\N
578	Fortitude	9	2026 - 2027	STE	2026-04-29 17:58:50.61	2026-04-29 17:58:50.61	\N	\N	var(--color-green-200)	\N	\N
579	Friendship	9	2026 - 2027	Regular	2026-04-29 17:58:50.611	2026-04-29 17:58:50.611	\N	\N	var(--color-green-100)	\N	\N
580	Harmony	9	2026 - 2027	Regular	2026-04-29 17:58:50.612	2026-04-29 17:58:50.612	\N	\N	var(--color-green-100)	\N	\N
581	Honesty	9	2026 - 2027	Regular	2026-04-29 17:58:50.613	2026-04-29 17:58:50.613	\N	\N	var(--color-green-100)	\N	\N
582	Humility	9	2026 - 2027	STE	2026-04-29 17:58:50.614	2026-04-29 17:58:50.614	\N	\N	var(--color-green-200)	\N	\N
583	Integrity	9	2026 - 2027	Regular	2026-04-29 17:58:50.615	2026-04-29 17:58:50.615	\N	\N	var(--color-green-100)	\N	\N
584	Justice	9	2026 - 2027	Regular	2026-04-29 17:58:50.616	2026-04-29 17:58:50.616	\N	\N	var(--color-green-100)	\N	\N
585	Love	9	2026 - 2027	Regular	2026-04-29 17:58:50.617	2026-04-29 17:58:50.617	\N	\N	var(--color-green-100)	\N	\N
586	Loyalty	9	2026 - 2027	Regular	2026-04-29 17:58:50.618	2026-04-29 17:58:50.618	\N	\N	var(--color-green-100)	\N	\N
587	Obedience	9	2026 - 2027	Regular	2026-04-29 17:58:50.619	2026-04-29 17:58:50.619	\N	\N	var(--color-green-100)	\N	\N
588	Patience	9	2026 - 2027	Regular	2026-04-29 17:58:50.62	2026-04-29 17:58:50.62	\N	\N	var(--color-green-100)	\N	\N
589	Peace	9	2026 - 2027	Regular	2026-04-29 17:58:50.621	2026-04-29 17:58:50.621	\N	\N	var(--color-green-100)	\N	\N
590	Prudence	9	2026 - 2027	SPA	2026-04-29 17:58:50.622	2026-04-29 17:58:50.622	\N	\N	var(--color-green-100)	\N	\N
591	Sincerity	9	2026 - 2027	Regular	2026-04-29 17:58:50.623	2026-04-29 17:58:50.623	\N	\N	var(--color-green-100)	\N	\N
592	Alexandrite	10	2026 - 2027	Regular	2026-04-29 17:58:50.624	2026-04-29 17:58:50.624	\N	\N	var(--color-violet-100)	\N	\N
593	Amber	10	2026 - 2027	SPA	2026-04-29 17:58:50.625	2026-04-29 17:58:50.625	\N	\N	var(--color-violet-100)	\N	\N
594	Amethyst	10	2026 - 2027	Regular	2026-04-29 17:58:50.626	2026-04-29 17:58:50.626	\N	\N	var(--color-violet-100)	\N	\N
595	Aquamarine	10	2026 - 2027	Regular	2026-04-29 17:58:50.627	2026-04-29 17:58:50.627	\N	\N	var(--color-violet-100)	\N	\N
596	Beryl	10	2026 - 2027	Regular	2026-04-29 17:58:50.628	2026-04-29 17:58:50.628	\N	\N	var(--color-violet-100)	\N	\N
597	Carnelian	10	2026 - 2027	Regular	2026-04-29 17:58:50.629	2026-04-29 17:58:50.629	\N	\N	var(--color-violet-100)	\N	\N
598	Citrine	10	2026 - 2027	SPJ	2026-04-29 17:58:50.63	2026-04-29 17:58:50.63	\N	\N	var(--color-violet-200)	\N	\N
599	Diamond	10	2026 - 2027	Regular	2026-04-29 17:58:50.631	2026-04-29 17:58:50.631	\N	\N	var(--color-violet-100)	\N	\N
600	Emerald	10	2026 - 2027	STE	2026-04-29 17:58:50.632	2026-04-29 17:58:50.632	\N	\N	var(--color-violet-200)	\N	\N
601	Garnet	10	2026 - 2027	Regular	2026-04-29 17:58:50.633	2026-04-29 17:58:50.633	\N	\N	var(--color-violet-100)	\N	\N
602	Jade	10	2026 - 2027	Regular	2026-04-29 17:58:50.634	2026-04-29 17:58:50.634	\N	\N	var(--color-violet-100)	\N	\N
603	Olivine	10	2026 - 2027	Regular	2026-04-29 17:58:50.641	2026-04-29 17:58:50.641	\N	\N	var(--color-violet-100)	\N	\N
604	Onyx	10	2026 - 2027	STE	2026-04-29 17:58:50.642	2026-04-29 17:58:50.642	\N	\N	var(--color-violet-200)	\N	\N
605	Opal	10	2026 - 2027	Regular	2026-04-29 17:58:50.643	2026-04-29 17:58:50.643	\N	\N	var(--color-violet-100)	\N	\N
606	Peridot	10	2026 - 2027	Regular	2026-04-29 17:58:50.644	2026-04-29 17:58:50.644	\N	\N	var(--color-violet-100)	\N	\N
607	Ruby	10	2026 - 2027	Regular	2026-04-29 17:58:50.645	2026-04-29 17:58:50.645	\N	\N	var(--color-violet-100)	\N	\N
608	Sapphire	10	2026 - 2027	Regular	2026-04-29 17:58:50.646	2026-04-29 17:58:50.646	\N	\N	var(--color-violet-100)	\N	\N
609	Sardonyx	10	2026 - 2027	Regular	2026-04-29 17:58:50.647	2026-04-29 17:58:50.647	\N	\N	var(--color-violet-100)	\N	\N
610	Sphene	10	2026 - 2027	SPS	2026-04-29 17:58:50.647	2026-04-29 17:58:50.647	\N	\N	var(--color-violet-300)	\N	\N
611	Spinel	10	2026 - 2027	Regular	2026-04-29 17:58:50.648	2026-04-29 17:58:50.648	\N	\N	var(--color-violet-100)	\N	\N
612	Topaz	10	2026 - 2027	Regular	2026-04-29 17:58:50.65	2026-04-29 17:58:50.65	\N	\N	var(--color-violet-100)	\N	\N
613	Zircon	10	2026 - 2027	Regular	2026-04-29 17:58:50.651	2026-04-29 17:58:50.651	\N	\N	var(--color-violet-100)	\N	\N
528	Adhara	7	2026 - 2027	Regular	2026-04-29 17:58:50.558	2026-04-29 17:59:21.479	6	\N	var(--color-blue-100)	null	\N
\.


--
-- Data for Name: sf5_reports; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.sf5_reports (id, "studentId", "generalAverage", "actionTaken", "learningAreasNotMet") FROM stdin;
\.


--
-- Data for Name: sf9_core_values; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.sf9_core_values (id, "studentId", "coreValueId", q1, q2, q3, q4) FROM stdin;
\.


--
-- Data for Name: sf9_grade_items; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.sf9_grade_items (id, "sf9GradeId", quarter, type, score, "maxScore", "createdAt") FROM stdin;
\.


--
-- Data for Name: sf9_grades; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.sf9_grades (id, "studentId", "learningAreaId", "schoolYear", q1, q2, q3, q4, "finalRating", remarks, "q1Ready", "q2Ready", "q3Ready", "q4Ready") FROM stdin;
\.


--
-- Data for Name: sf9_summaries; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.sf9_summaries (id, "studentId", "schoolYear", "generalAverage") FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: myadmin
--

COPY public.students (id, lrn, "firstName", "middleName", "lastName", "nameExtension", sex, "birthDate", "motherTongue", "ethnicGroup", religion, email, "createdByAdviserId", "createdAt", "updatedAt") FROM stdin;
1213	115521180060	Ivan	Tobongbanua	Abanilla	\N	MALE	2013-08-20	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.117	2026-05-11 07:19:52.117
1214	440095180003	Elldrich	Cabar	Arlanza	\N	MALE	2012-12-05	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.137	2026-05-11 07:19:52.137
1215	440096180011	Ken	Naijel Projillo	Atup	\N	MALE	2012-11-20	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.141	2026-05-11 07:19:52.141
1216	440123180021	Denver	Jan Hechanova	Bartonico	\N	MALE	2013-01-19	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.145	2026-05-11 07:19:52.145
1217	116643180020	Jhon	Random Hachero	Daria	\N	MALE	2012-08-22	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.148	2026-05-11 07:19:52.148
1218	440246180028	Yohan	Brix Caro	De La Cruz	\N	MALE	2013-06-12	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.151	2026-05-11 07:19:52.151
1219	116643180028	Kent	Anthony Gumban	Diesto	\N	MALE	2013-04-18	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.155	2026-05-11 07:19:52.155
1220	115600180018	Joreem	Warren Berondo	Garcia	\N	MALE	2013-03-21	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.157	2026-05-11 07:19:52.157
1221	440097180024	Jhon	Messiah Caro	Gerono	\N	MALE	2012-09-09	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.16	2026-05-11 07:19:52.16
1222	116286180007	Rovian	Brent Dana	Guillem	\N	MALE	2012-09-30	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.163	2026-05-11 07:19:52.163
1223	116643180006	Ronboy	Rendon	Gumban	\N	MALE	2013-01-06	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.166	2026-05-11 07:19:52.166
1224	116643180040	Ramel	Jr Cadicoy	Hallara	\N	MALE	2012-10-23	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.168	2026-05-11 07:19:52.168
1225	116643180086	Wyne	Gabriel Verallo	Ibañez	\N	MALE	2013-02-26	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.171	2026-05-11 07:19:52.171
1226	116642180027	Ralph	Joseph Jomento	Inefable	\N	MALE	2013-01-30	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.173	2026-05-11 07:19:52.173
1227	116645180063	Jed	Alfaro	Maciado	\N	MALE	2013-03-25	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.176	2026-05-11 07:19:52.176
1228	116636180035	Christian	James Caro	Mones	\N	MALE	2013-08-19	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.179	2026-05-11 07:19:52.179
1229	116640180013	Danniel	John Talabong	Montuya	\N	MALE	2012-10-05	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.182	2026-05-11 07:19:52.182
1230	116642180068	Louis	Gabriel Billena	Nomos	\N	MALE	2013-02-04	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.185	2026-05-11 07:19:52.185
1231	117602180135	Janzyl	Gastar	Osano	\N	MALE	2013-09-17	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.188	2026-05-11 07:19:52.188
1232	116645180027	Prince	Laurence Saberon	Perdenia	\N	MALE	2012-09-12	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.191	2026-05-11 07:19:52.191
1233	440097180032	Rayyan	Ali -	Rashid	\N	MALE	2013-07-02	Hiligaynon	\N	Islam	\N	12332112	2026-05-11 07:19:52.195	2026-05-11 07:19:52.195
1234	116644180052	Jacob	Faburada	Segovia	\N	MALE	2013-07-05	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.198	2026-05-11 07:19:52.198
1235	115811180016	Jan	Joey Baat	Sollano	\N	MALE	2013-01-20	Kinaray-a	\N	Christianity	\N	12332112	2026-05-11 07:19:52.201	2026-05-11 07:19:52.201
1236	409046180010	Caspian	Poral	Victoriano	\N	MALE	2013-07-04	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.204	2026-05-11 07:19:52.204
1237	117590180183	Psalm	Yuhannes Lusanta	Villaluna	\N	MALE	2012-10-08	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.206	2026-05-11 07:19:52.206
1238	440146180004	Alessandra	Marie Lloren	Ablanido	\N	FEMALE	2013-04-30	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.21	2026-05-11 07:19:52.21
1239	116642180032	Zjeiah	Knoelle Capre	Banatao	\N	FEMALE	2013-05-10	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.213	2026-05-11 07:19:52.213
1240	116642180055	Ma	Princess Ferrer	Bellera	\N	FEMALE	2013-01-01	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.216	2026-05-11 07:19:52.216
1241	440047180009	Avah	Grace -	Cardiente	\N	FEMALE	2013-04-05	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.218	2026-05-11 07:19:52.218
1242	117590180135	Johnea	Shaine Testigo	Casaquite	\N	FEMALE	2013-07-20	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.221	2026-05-11 07:19:52.221
1243	440252180024	Cianni	Lou Nicole Herrera	Delos Santos	\N	FEMALE	2012-12-04	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.225	2026-05-11 07:19:52.225
1244	116641180046	Jinyfel	Diana	Dulapo	\N	FEMALE	2013-01-29	Kinaray-a	\N	Christianity	\N	12332112	2026-05-11 07:19:52.229	2026-05-11 07:19:52.229
1245	116643180127	Kristine	Faith Salaum	Galbizo	\N	FEMALE	2012-10-20	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.232	2026-05-11 07:19:52.232
1246	116636180071	Leslie	Jean Parreño	Gerada	\N	FEMALE	2013-05-30	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.234	2026-05-11 07:19:52.234
1247	116645180041	Kerziah	Alexis Bacalangco	Glorial	\N	FEMALE	2013-05-27	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.237	2026-05-11 07:19:52.237
1248	440096180001	Adriana	Candice Lozada	Gobuyan	\N	FEMALE	2013-04-15	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.241	2026-05-11 07:19:52.241
1249	116642180039	Shaliyah	Kristel Toreno	Hubernadas	\N	FEMALE	2013-04-12	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.243	2026-05-11 07:19:52.243
1250	116635180011	Jhez	Zyrhiel Gumban	Jadulan	\N	FEMALE	2013-07-07	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.245	2026-05-11 07:19:52.245
1251	405673180007	Mary	Grace Gocela	Jovero	\N	FEMALE	2013-01-30	Cebuano / Sinugbuanong Binisay	\N	Christianity	\N	12332112	2026-05-11 07:19:52.247	2026-05-11 07:19:52.247
1252	116644180006	Mich	Mecmec	Larroza	\N	FEMALE	2012-09-15	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.25	2026-05-11 07:19:52.25
1253	116643180039	Cheryl	Jane Febrada	Mandar	\N	FEMALE	2012-12-10	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.252	2026-05-11 07:19:52.252
1254	116645180054	Heleana	Alvarado	Mañez	\N	FEMALE	2013-01-18	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.255	2026-05-11 07:19:52.255
1255	440036180010	Ryah	Ricci Lazaro	Mecha	\N	FEMALE	2013-09-29	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.258	2026-05-11 07:19:52.258
1256	116638180047	Khryslee	New Otian	Mirador	\N	FEMALE	2013-03-13	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.26	2026-05-11 07:19:52.26
1257	440039180021	Samantha	Freya Abellar	Noble	\N	FEMALE	2013-06-14	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.262	2026-05-11 07:19:52.262
1258	116642180021	Melody	Janolino	Pedregosa	\N	FEMALE	2012-12-03	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.264	2026-05-11 07:19:52.264
1259	116645180089	Precious	Aliyah De Castro	Sinopera	\N	FEMALE	2013-01-25	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.266	2026-05-11 07:19:52.266
1260	116640180029	Abegail	Dionisio	Sopeña	\N	FEMALE	2012-09-24	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.27	2026-05-11 07:19:52.27
1261	116797180019	Natalie	De La Cruz	Suficiencia	\N	FEMALE	2013-03-08	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.272	2026-05-11 07:19:52.272
1262	117614180046	Jhaezel	Pitulan	Tamayo	\N	FEMALE	2013-09-02	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.276	2026-05-11 07:19:52.276
1263	116642180041	Alaisa	Janolino	Timbancaya	\N	FEMALE	2012-12-19	Hiligaynon	\N	Christianity	\N	12332112	2026-05-11 07:19:52.278	2026-05-11 07:19:52.278
\.


--
-- Name: Admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public."Admin_id_seq"', 2, true);


--
-- Name: Announcement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public."Announcement_id_seq"', 14, true);


--
-- Name: Event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public."Event_id_seq"', 14, true);


--
-- Name: Quarter_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public."Quarter_id_seq"', 8, true);


--
-- Name: SchoolYear_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public."SchoolYear_id_seq"', 2, true);


--
-- Name: addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.addresses_id_seq', 794, true);


--
-- Name: advisers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.advisers_id_seq', 6, true);


--
-- Name: core_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.core_values_id_seq', 1, false);


--
-- Name: enrollment_learning_areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.enrollment_learning_areas_id_seq', 800, true);


--
-- Name: enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.enrollments_id_seq', 1359, true);


--
-- Name: guardians_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.guardians_id_seq', 778, true);


--
-- Name: learning_areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.learning_areas_id_seq', 204, true);


--
-- Name: school_forms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.school_forms_id_seq', 2099, true);


--
-- Name: schools_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.schools_id_seq', 1, false);


--
-- Name: sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.sections_id_seq', 613, true);


--
-- Name: sf5_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.sf5_reports_id_seq', 1, false);


--
-- Name: sf9_core_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.sf9_core_values_id_seq', 1, false);


--
-- Name: sf9_grade_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.sf9_grade_items_id_seq', 3, true);


--
-- Name: sf9_grades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.sf9_grades_id_seq', 12377, true);


--
-- Name: sf9_summaries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.sf9_summaries_id_seq', 1, false);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myadmin
--

SELECT pg_catalog.setval('public.students_id_seq', 1263, true);


--
-- Name: Admin Admin_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT "Admin_pkey" PRIMARY KEY (id);


--
-- Name: Announcement Announcement_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: Quarter Quarter_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public."Quarter"
    ADD CONSTRAINT "Quarter_pkey" PRIMARY KEY (id);


--
-- Name: SchoolYear SchoolYear_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public."SchoolYear"
    ADD CONSTRAINT "SchoolYear_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: advisers advisers_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.advisers
    ADD CONSTRAINT advisers_pkey PRIMARY KEY (id);


--
-- Name: core_values core_values_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.core_values
    ADD CONSTRAINT core_values_pkey PRIMARY KEY (id);


--
-- Name: enrollment_learning_areas enrollment_learning_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.enrollment_learning_areas
    ADD CONSTRAINT enrollment_learning_areas_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: guardians guardians_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_pkey PRIMARY KEY (id);


--
-- Name: learning_areas learning_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.learning_areas
    ADD CONSTRAINT learning_areas_pkey PRIMARY KEY (id);


--
-- Name: school_forms school_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.school_forms
    ADD CONSTRAINT school_forms_pkey PRIMARY KEY (id);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: sf5_reports sf5_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf5_reports
    ADD CONSTRAINT sf5_reports_pkey PRIMARY KEY (id);


--
-- Name: sf9_core_values sf9_core_values_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf9_core_values
    ADD CONSTRAINT sf9_core_values_pkey PRIMARY KEY (id);


--
-- Name: sf9_grade_items sf9_grade_items_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf9_grade_items
    ADD CONSTRAINT sf9_grade_items_pkey PRIMARY KEY (id);


--
-- Name: sf9_grades sf9_grades_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf9_grades
    ADD CONSTRAINT sf9_grades_pkey PRIMARY KEY (id);


--
-- Name: sf9_summaries sf9_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf9_summaries
    ADD CONSTRAINT sf9_summaries_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: Admin_email_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "Admin_email_key" ON public."Admin" USING btree (email);


--
-- Name: Admin_resetToken_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "Admin_resetToken_key" ON public."Admin" USING btree ("resetToken");


--
-- Name: Admin_username_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "Admin_username_key" ON public."Admin" USING btree (username);


--
-- Name: Quarter_schoolYearId_name_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "Quarter_schoolYearId_name_key" ON public."Quarter" USING btree ("schoolYearId", name);


--
-- Name: SchoolYear_label_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "SchoolYear_label_key" ON public."SchoolYear" USING btree (label);


--
-- Name: addresses_studentId_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "addresses_studentId_key" ON public.addresses USING btree ("studentId");


--
-- Name: advisers_adviserId_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "advisers_adviserId_key" ON public.advisers USING btree ("adviserId");


--
-- Name: advisers_email_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX advisers_email_key ON public.advisers USING btree (email);


--
-- Name: advisers_resetToken_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "advisers_resetToken_key" ON public.advisers USING btree ("resetToken");


--
-- Name: enrollment_learning_areas_enrollmentId_learningAreaId_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "enrollment_learning_areas_enrollmentId_learningAreaId_key" ON public.enrollment_learning_areas USING btree ("enrollmentId", "learningAreaId");


--
-- Name: enrollments_studentId_schoolYear_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "enrollments_studentId_schoolYear_key" ON public.enrollments USING btree ("studentId", "schoolYear");


--
-- Name: guardians_studentId_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "guardians_studentId_key" ON public.guardians USING btree ("studentId");


--
-- Name: learning_areas_name_gradeLevel_curriculum_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "learning_areas_name_gradeLevel_curriculum_key" ON public.learning_areas USING btree (name, "gradeLevel", curriculum);


--
-- Name: school_forms_sectionId_schoolYear_type_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "school_forms_sectionId_schoolYear_type_key" ON public.school_forms USING btree ("sectionId", "schoolYear", type);


--
-- Name: schools_schoolIdNumber_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "schools_schoolIdNumber_key" ON public.schools USING btree ("schoolIdNumber");


--
-- Name: sections_schoolYear_gradeLevel_name_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "sections_schoolYear_gradeLevel_name_key" ON public.sections USING btree ("schoolYear", "gradeLevel", name);


--
-- Name: sf9_core_values_studentId_coreValueId_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "sf9_core_values_studentId_coreValueId_key" ON public.sf9_core_values USING btree ("studentId", "coreValueId");


--
-- Name: sf9_grades_studentId_learningAreaId_schoolYear_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "sf9_grades_studentId_learningAreaId_schoolYear_key" ON public.sf9_grades USING btree ("studentId", "learningAreaId", "schoolYear");


--
-- Name: sf9_summaries_studentId_schoolYear_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX "sf9_summaries_studentId_schoolYear_key" ON public.sf9_summaries USING btree ("studentId", "schoolYear");


--
-- Name: students_email_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX students_email_key ON public.students USING btree (email);


--
-- Name: students_lrn_key; Type: INDEX; Schema: public; Owner: myadmin
--

CREATE UNIQUE INDEX students_lrn_key ON public.students USING btree (lrn);


--
-- Name: Announcement Announcement_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."Admin"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Event Event_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."Admin"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Quarter Quarter_schoolYearId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public."Quarter"
    ADD CONSTRAINT "Quarter_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES public."SchoolYear"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: addresses addresses_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT "addresses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enrollment_learning_areas enrollment_learning_areas_enrollmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.enrollment_learning_areas
    ADD CONSTRAINT "enrollment_learning_areas_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES public.enrollments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enrollment_learning_areas enrollment_learning_areas_learningAreaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.enrollment_learning_areas
    ADD CONSTRAINT "enrollment_learning_areas_learningAreaId_fkey" FOREIGN KEY ("learningAreaId") REFERENCES public.learning_areas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: enrollments enrollments_sectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "enrollments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES public.sections(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: enrollments enrollments_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: guardians guardians_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT "guardians_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: learning_areas learning_areas_adviserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.learning_areas
    ADD CONSTRAINT "learning_areas_adviserId_fkey" FOREIGN KEY ("adviserId") REFERENCES public.advisers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: school_forms school_forms_sectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.school_forms
    ADD CONSTRAINT "school_forms_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES public.sections(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sections sections_adviserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT "sections_adviserId_fkey" FOREIGN KEY ("adviserId") REFERENCES public.advisers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sf5_reports sf5_reports_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf5_reports
    ADD CONSTRAINT "sf5_reports_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sf9_core_values sf9_core_values_coreValueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf9_core_values
    ADD CONSTRAINT "sf9_core_values_coreValueId_fkey" FOREIGN KEY ("coreValueId") REFERENCES public.core_values(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sf9_core_values sf9_core_values_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf9_core_values
    ADD CONSTRAINT "sf9_core_values_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sf9_grade_items sf9_grade_items_sf9GradeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf9_grade_items
    ADD CONSTRAINT "sf9_grade_items_sf9GradeId_fkey" FOREIGN KEY ("sf9GradeId") REFERENCES public.sf9_grades(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sf9_grades sf9_grades_learningAreaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf9_grades
    ADD CONSTRAINT "sf9_grades_learningAreaId_fkey" FOREIGN KEY ("learningAreaId") REFERENCES public.learning_areas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sf9_grades sf9_grades_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf9_grades
    ADD CONSTRAINT "sf9_grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sf9_summaries sf9_summaries_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.sf9_summaries
    ADD CONSTRAINT "sf9_summaries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: students students_createdByAdviserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myadmin
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "students_createdByAdviserId_fkey" FOREIGN KEY ("createdByAdviserId") REFERENCES public.advisers("adviserId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: myadmin
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict pYoQiZvv2Q9Xsy445mZ2tr8aObiIvXAPTmxoo4ZwhbE9NfFy3KrVaKhNIkUNurc

