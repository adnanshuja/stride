# Data Models

## Admin (`models/Admin.js`)
| Field | Type | Notes |
|-------|------|-------|
| email | String | required, unique |
| passwordHash | String | required |
| signupCode | String | bcrypt hash, nullable |
| signupCodeDisplay | String | plaintext for admin to view/share, nullable |
| signupCodeExpires | Date | nullable, 7d expiry |
| createdAt | Date | auto |

Admin has `generateSignupCode()` method: generates 8-char hex code, stores both bcrypt hash + plaintext display, sets 7d expiry. Returns plaintext code.

## Member (`models/Member.js`)
| Field | Type | Notes |
|-------|------|-------|
| name | String | required |
| email | String | required, unique, lowercase |
| category | String | enum: FREE, RESTRICTED |
| passwordHash | String | nullable |
| isActive | Boolean | default: false |
| emailVerified | Boolean | default: false |
| adminId | ObjectId | ref: Admin |
| gmailRefreshToken | String | nullable |
| gmailEmail | String | nullable |
| restrictedKeywords | [String] | default list below |
| createdAt | Date | auto |

Default keywords: applied, application, LinkedIn, LangChain, AutoGen, agent, interview, resume, Coursera, Udemy, Claude, GPT, LLM, agentic, AI engineer, machine learning, course, offer

## DailyLog (`models/DailyLog.js`)
| Field | Type | Notes |
|-------|------|-------|
| memberId | ObjectId | ref: Member, required |
| date | String | YYYY-MM-DD, required |
| hours | Map\<String,String\> | keys=slot numbers, values=text |
| courseHours | Map\<String,String\> | slot → courseId for course-linked entries |
| entryDurations | Map\<String,Number\> | slot → minutes tracked for this entry |
| autoDetected | [Object] | see below |
| startedAt | String | HH:mm — when member started |
| breakCount | Number | breaks taken today |
| updatedAt | Date | auto |

Unique index: `{ memberId: 1, date: 1 }`
autoDetected fields: `source` (gmail_sent/linkedin), `company`, `role`, `time` (HH:mm), `hour`, `rawSubject`

## Course (`models/Course.js`)
| Field | Type | Notes |
|-------|------|-------|
| memberId | ObjectId | ref: Member, required |
| name | String | required |
| description | String | optional |
| status | String | enum: active, completed |
| completedAt | Date | nullable |
| completedComment | String | what member learned |
| totalTopics | Number | default: 0 |
| completedTopics | Number | default: 0 |
| totalCourseMinutes | Number | default: 0 — sum of all topic timeSpent |
| createdAt | Date | auto |

## Topic (`models/Topic.js`)
| Field | Type | Notes |
|-------|------|-------|
| courseId | ObjectId | ref: Course, required |
| name | String | required |
| notes | String | optional |
| order | Number | ordering within course |
| status | String | enum: active, completed |
| completedAt | Date | nullable |
| timeSpent | Number | minutes spent on this topic |
| createdAt | Date | auto |

## JobApplication (`models/JobApplication.js`)
| Field | Type | Notes |
|-------|------|-------|
| memberId | ObjectId | ref: Member, required |
| company | String | required |
| role | String | required |
| source | String | enum: linkedin, gmail, direct, link |
| url | String | nullable |
| notes | String | optional |
| status | String | enum: applied, interviewed, rejected, offered |
| date | String | YYYY-MM-DD |
| createdAt | Date | auto |
