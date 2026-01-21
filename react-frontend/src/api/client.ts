/**
 * API client with Axios + token management
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export interface SignUpRequest {
  email: string;
  password: string;
  user_type: 'candidate' | 'company';
  company_role?: 'ADMIN' | 'HR' | 'RECRUITER';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CandidateProfile {
  id?: number;
  user_id?: number;
  name: string;
  email?: string;
  phone?: string;
  residential_address?: string;
  location?: string;
  profile_picture_path?: string;
  visa_type?: string;
  ethnicity?: string;
  product_author?: string;
  product?: string;
  primary_role?: string;
  summary?: string;
  years_experience?: number;
  rate_min?: number;
  rate_max?: number;
  availability?: string;
  work_type?: string;
  location_preference_1?: string;
  location_preference_2?: string;
  location_preference_3?: string;
  is_general_info_complete?: boolean;
  skills?: Array<{ id: number; name: string; level?: string; category?: string; rating?: number }>;
  certifications?: any[];
  resumes?: any[];
  applications?: any[];
}

export interface Skill {
  id?: number;
  name: string;
  rating?: number;  // 1-5 star rating
  level?: string;
  category?: string;
}

export interface Certification {
  id?: number;
  name: string;
  issuer?: string;
  year?: number;
}

export interface Resume {
  id: number;
  filename: string;
  created_at: string;
}

export interface JobPreference {
  id?: number;
  candidate_id?: number;
  product_author_id: number;
  product_id: number;
  roles: string[];
  primary_role?: string;
  product?: string;
  location?: string;
  seniority_level?: string;
  years_experience_min?: number;
  years_experience_max?: number;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  required_skills?: string[] | string;
  work_type?: string;
  visa_type?: string;
  ethnicity?: string;
  location_preferences?: string[];
  availability?: string;
  preference_name?: string;
  summary?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CandidateProfileWithPreferences {
  id: number;
  user_id: number;
  name: string;
  location?: string;
  profile_picture_path?: string;
  summary?: string;
  work_type?: string;
  availability?: string;
  created_at: string;
  updated_at: string;
  job_preferences: JobPreference[];
}

export interface JobPost {
  id: number;
  company_id: number;
  title: string;
  description?: string;
  product_author: string;
  product: string;
  role: string;
  seniority?: string;
  job_type?: string;
  duration?: string;
  start_date?: string;
  currency?: string;
  location?: string;
  work_type?: string;
  min_rate?: number;
  max_rate?: number;
  salary_min?: number;
  salary_max?: number;
  required_skills?: string[];
  nice_to_have_skills?: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateCard {
  candidate_id: number;
  name: string;
  location?: string;
  years_experience?: number;
  product_author?: string;
  product?: string;
  primary_role?: string;
  rate_min?: number;
  rate_max?: number;
  availability?: string;
  skills: string[];
  match_score: number;
  match_explanation: {
    matched_skills: string[];
    missing_skills: string[];
    rate_fit: boolean;
    location_fit: boolean;
    overall_score: number;
  };
}

export interface CandidateFeedResponse {
  candidates: CandidateCard[];
  total_count: number;
}

export interface Application {
  id: number;
  job_post_id: number;
  job_title: string;
  company_name: string;
  status: string;
  match_score?: number;
  applied_at: string;
}

export interface RankingItem {
  candidate_id: number;
  name: string;
  rank: number;
  score: number;
  explanation: any;
}

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
export const getToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('access_token');
  console.log('[API] Token removed from localStorage');
};

// Request interceptor for auth
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API-REQUEST] ${config.method?.toUpperCase()} ${config.url} - Token attached`);
    } else {
      console.log(`[API-REQUEST] ${config.method?.toUpperCase()} ${config.url} - No token`);
    }
    return config;
  },
  (error) => {
    console.error('[API-REQUEST-ERROR]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API-RESPONSE] ${response.status} - ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`[API-RESPONSE-ERROR] ${error.config?.url} - ${error.response?.status} - ${error.response?.data?.detail || error.message}`);
    
    // Handle expired/invalid token (401 Unauthorized or 403 Forbidden)
    if (error.response?.status === 401 || error.response?.status === 403) {
      const detail = error.response?.data?.detail || '';
      // If token is invalid or user doesn't have access, clear auth and redirect to login
      if (detail.includes('access required') || detail.includes('Invalid token') || detail.includes('Unauthorized')) {
        console.log('[API] Token expired or invalid - clearing auth state');
        removeToken();
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_type');
        localStorage.removeItem('user_email');
        localStorage.removeItem('company_role');
        // Redirect to signin page
        window.location.href = '/signin';
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================================================
// AUTH API
// ============================================================================
export const authAPI = {
  signup: (data: SignUpRequest) => {
    console.log(`[AUTH-API] Signup attempt - email: ${data.email}, type: ${data.user_type}`);
    return apiClient.post('/auth/signup', data).then(res => {
      console.log('[AUTH-API] Signup successful');
      return res;
    });
  },

  login: (data: LoginRequest) => {
    console.log(`[AUTH-API] Login attempt - email: ${data.email}`);
    return apiClient.post('/auth/login', data).then(res => {
      console.log('[AUTH-API] Login successful - returning response');
      return res;
    });
  },
};

// ============================================================================
// CANDIDATE API
// ============================================================================
export const candidateAPI = {
  // Profile
  getMe: () => {
    console.log('[CANDIDATE-API] Fetching current candidate profile');
    return apiClient.get<CandidateProfile>('/candidates/me').then(res => {
      console.log('[CANDIDATE-API] Profile fetched successfully');
      return res;
    });
  },

  updateMe: (data: Partial<CandidateProfile>) =>
    apiClient.put<CandidateProfile>('/candidates/me', data),

  getById: (candidateId: number) =>
    apiClient.get<CandidateProfile>(`/candidates/${candidateId}`),

  // Skills
  addSkill: (skill: Skill) =>
    apiClient.post<Skill>('/candidates/me/skills', skill),

  listSkills: () =>
    apiClient.get<Skill[]>('/candidates/me/skills'),

  removeSkill: (skillId: number) =>
    apiClient.delete(`/candidates/me/skills/${skillId}`),

  // Certifications
  addCertification: (cert: Certification) =>
    apiClient.post<Certification>('/candidates/me/certifications', cert),

  listCertifications: () =>
    apiClient.get<Certification[]>('/candidates/me/certifications'),

  // Social Links
  addSocialLink: (link: { platform: string; url: string; display_name?: string }) =>
    apiClient.post('/candidates/me/social-links', link),

  getSocialLinks: () =>
    apiClient.get('/candidates/me/social-links'),

  updateSocialLink: (linkId: number, link: { platform: string; url: string; display_name?: string }) =>
    apiClient.put(`/candidates/me/social-links/${linkId}`, link),

  deleteSocialLink: (linkId: number) =>
    apiClient.delete(`/candidates/me/social-links/${linkId}`),

  // Resumes
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<Resume>('/candidates/me/resumes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  listResumes: () =>
    apiClient.get<Resume[]>('/candidates/me/resumes'),

  downloadResume: (resumeId: number) =>
    apiClient.get(`/candidates/me/resumes/${resumeId}/download`, {
      responseType: 'blob',
    }),

  // Applications
  listApplications: () =>
    apiClient.get<Application[]>('/candidates/me/applications'),

  // Matching
  getRoleFit: (candidateId: number, author: string, product: string, role: string) =>
    apiClient.post(`/candidates/${candidateId}/role-fit`, {
      product_author: author,
      product,
      job_role: role,
    }),
  
  // List all candidates with preferences (for company users)
  listAllCandidates: () =>
    apiClient.get<CandidateProfile[]>('/candidates/list/all'),
};

// ============================================================================
// JOB ROLES API (Ontology)
// ============================================================================
export const jobRolesAPI = {
  getAll: () =>
    apiClient.get('/job-roles/'),

  getAuthors: () =>
    apiClient.get('/job-roles/authors'),

  getProducts: (author: string) =>
    apiClient.get('/job-roles/products', { params: { author } }),

  getRoles: (author: string, product: string) =>
    apiClient.get('/job-roles/roles', { params: { author, product } }),

  getSkills: () =>
    apiClient.get('/job-roles/skills'),
};

// ============================================================================
// COMPANY API
// ============================================================================
export const companyAPI = {
  createAccount: (data: any) =>
    apiClient.post('/company/create-account', data),

  getMe: () =>
    apiClient.get('/company/me'),

  getProfile: (companyId: number) =>
    apiClient.get(`/company/${companyId}`),

  addEmployee: (data: any) =>
    apiClient.post('/company/users', data),

  listEmployees: (companyId: number) =>
    apiClient.get(`/company/${companyId}/employees`),
};

// ============================================================================
// JOB PREFERENCES API
// ============================================================================
export const preferencesAPI = {
  create: (data: JobPreference) =>
    apiClient.post<JobPreference>('/preferences/create', data),

  getMyPreferences: () =>
    apiClient.get<JobPreference[]>('/preferences/my-preferences'),

  getProfileWithPreferences: () =>
    apiClient.get<CandidateProfileWithPreferences>('/preferences/my-profile'),

  getById: (preferenceId: number) =>
    apiClient.get<JobPreference>(`/preferences/${preferenceId}`),

  update: (preferenceId: number, data: Partial<JobPreference>) =>
    apiClient.put<JobPreference>(`/preferences/${preferenceId}`, data),

  delete: (preferenceId: number) =>
    apiClient.delete(`/preferences/${preferenceId}`),
};

// ============================================================================
// JOBS API
// ============================================================================
export const jobsAPI = {
  create: (data: Partial<JobPost>) =>
    apiClient.post<JobPost>('/jobs/create', data),

  list: () =>
    apiClient.get<JobPost[]>('/jobs/'),

  listAll: () =>
    apiClient.get<JobPost[]>('/jobs/available'),

  get: (jobId: number) =>
    apiClient.get<JobPost>(`/jobs/${jobId}`),

  update: (jobId: number, data: Partial<JobPost>) =>
    apiClient.patch<JobPost>(`/jobs/${jobId}`, data),

  delete: (jobId: number) =>
    apiClient.delete(`/jobs/${jobId}`),

  // Company-wide job listing (Admin/HR only)
  getCompanyAllPostings: () =>
    apiClient.get<JobPost[]>('/jobs/company/all-postings'),

  // Recruiter's own job postings (created by current user)
  getRecruiterAccessiblePostings: () =>
    apiClient.get<JobPost[]>('/jobs/recruiter/my-accessible-postings'),

  // Jobs assigned to current recruiter
  getJobsAssignedToMe: () =>
    apiClient.get<JobPost[]>('/jobs/assigned-to-me'),

  // All company job postings for recruiter view
  getRecruiterPostings: () =>
    apiClient.get<JobPost[]>('/jobs/recruiter/my-postings'),

  createJobPosting: (data: Partial<JobPost>) =>
    apiClient.post<JobPost>('/jobs/recruiter/create', data),

  updateJobPosting: (jobId: number, data: Partial<JobPost>) =>
    apiClient.put<JobPost>(`/jobs/recruiter/${jobId}`, data),

  deleteJobPosting: (jobId: number) =>
    apiClient.delete(`/jobs/recruiter/${jobId}`),

  // Team management endpoints
  assignJobToRecruiter: (jobId: number, assignedToUserId: number) =>
    apiClient.put<JobPost>(`/jobs/${jobId}/assign`, { assigned_to_user_id: assignedToUserId }),

  getTeamWorkload: () =>
    apiClient.get<any[]>('/jobs/team/workload'),
};

// ============================================================================
// SWIPES API
// ============================================================================
export const swipesAPI = {
  getCandidateFeed: (jobId: number, limit: number = 10, offset: number = 0) =>
    apiClient.get<CandidateFeedResponse>(`/swipes/feed/${jobId}`, {
      params: { limit, offset },
    }),

  like: (candidateId: number, jobId: number) =>
    apiClient.post('/swipes/like', {
      candidate_id: candidateId,
      job_post_id: jobId,
    }),

  pass: (candidateId: number, jobId: number) =>
    apiClient.post('/swipes/pass', {
      candidate_id: candidateId,
      job_post_id: jobId,
    }),

  getShortlist: (jobId: number) =>
    apiClient.get<CandidateCard[]>(`/swipes/shortlist/${jobId}`),

  getRanking: (jobId: number) =>
    apiClient.get<RankingItem[]>(`/swipes/ranking/${jobId}`),
};

// ============================================================================
// RECOMMENDATIONS API
// ============================================================================
export const recommendationsAPI = {
  // Get job recommendations for current candidate
  getCandidateRecommendations: (topN: number = 10, offset: number = 0) =>
    apiClient.get<any>('/candidates/me/recommendations', {
      params: { top_n: topN, offset }
    }),

  // Get candidate recommendations for a specific job
  getJobRecommendations: (jobId: number, topN: number = 10, offset: number = 0) =>
    apiClient.get<any>(`/jobs/recommendations/${jobId}`, {
      params: { top_n: topN, offset }
    }),

  // Get all candidate recommendations across all company jobs
  getAllRecommendations: (topN: number = 10, offset: number = 0) =>
    apiClient.get<any>('/jobs/recommendations/all', {
      params: { top_n: topN, offset }
    }),
};

// ============================================================================
// MATCH STATE API (Swipe Actions)
// ============================================================================
export const matchesAPI = {
  // Candidate actions on a job
  candidateAction: (jobPostId: number, action: 'LIKE' | 'PASS' | 'APPLY') =>
    apiClient.post<any>('/matches/candidate/action', null, {
      params: { job_post_id: jobPostId, action }
    }),

  // Recruiter actions on a candidate for a job
  recruiterAction: (candidateId: number, jobPostId: number, action: 'LIKE' | 'PASS' | 'ASK_TO_APPLY', message?: string) =>
    apiClient.post<any>('/matches/recruiter/action', null, {
      params: { candidate_id: candidateId, job_post_id: jobPostId, action, message }
    }),

  // Get pending ask-to-apply requests for candidate
  getPendingAsks: () =>
    apiClient.get<any>('/matches/candidate/pending-asks'),

  // Respond to ask-to-apply request
  respondToAsk: (matchStateId: number, response: 'ACCEPT' | 'DECLINE') =>
    apiClient.post<any>('/matches/candidate/respond-to-ask', null, {
      params: { match_state_id: matchStateId, response }
    }),

  // Get match state for a candidate-job pair
  getMatchState: (candidateId: number, jobPostId: number) =>
    apiClient.get<any>(`/matches/state/${candidateId}/${jobPostId}`),
};
