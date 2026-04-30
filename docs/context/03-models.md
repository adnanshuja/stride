# Data Models

## Admin (`models/Admin.js`)
| Field | Type | Notes |
|-------|------|-------|
| email | String | required, unique |
| passwordHash | String | required |
| createdAt | Date | auto |

## Member (`models/Member.js`)
| Field | Type | Notes |
|-------|------|-------|
| name | String | required |
| email | String | required, unique, lowercase |
| category | String | enum: FREE, RESTRICTED |
| passwordHash | String | nullable |
| signupCode | String | bcrypt hash, nullable |
| signupCodeExpires | Date | nullable, 7d expiry |
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
| createdAt | Date | auto |

## Topic (`models/Topic.js`)
| Field | Type | Notes |
|-------|------|-------|
| courseId | ObjectId | ref: Course, required |
| name | String | required |
| notes | String | optional |
| order | Number | ordering within course |
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
