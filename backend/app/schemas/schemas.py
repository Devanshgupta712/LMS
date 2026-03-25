from datetime import datetime
from pydantic import BaseModel, Field, AliasPath, AliasChoices


# ─── Auth ──────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class SendOTPRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class VerifyEmailRequest(BaseModel):
    email: str
    code: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "STUDENT"
    phone: str | None = Field(default=None, max_length=10)
    course: str | None = None

class AdminPasswordChangeRequest(BaseModel):
    newPassword: str = Field(alias="new_password")
    
class TokenResponse(BaseModel):
    access_token: str = Field(alias="access_token")
    token_type: str = Field(default="bearer", alias="token_type")
    user: "UserOut"

    class Config:
        populate_by_name = True

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    phone: str | None
    role: str
    studentId: str | None = None
    dob: str | None = None
    educationStatus: str | None = None
    highestEducation: str | None = None
    degree: str | None = None
    passingYear: str | None = None
    isActive: bool
    createdAt: datetime

    class Config:
        from_attributes = True
        use_enum_values = True
        populate_by_name = True

class AdminPermissionUpdate(BaseModel):
    manageUsers: bool = Field(default=False, alias="manage_users")
    manageBatches: bool = Field(default=False, alias="manage_batches")
    manageCourses: bool = Field(default=False, alias="manage_courses")
    manageLeaves: bool = Field(default=False, alias="manage_leaves")

    class Config:
        populate_by_name = True

class AdminPermissionOut(BaseModel):
    id: str
    userId: str
    manageUsers: bool = False
    manageBatches: bool = False
    manageCourses: bool = False
    manageLeaves: bool = False

    class Config:
        from_attributes = True
        populate_by_name = True

# ─── Courses ───────────────────────────────────────────
class CourseCreate(BaseModel):
    name: str
    description: str | None = None
    duration: str | None = None
    fee: float = 0

class CourseOut(BaseModel):
    id: str
    name: str
    description: str | None
    duration: str | None
    fee: float
    isActive: bool
    createdAt: datetime
    batchCount: int = 0
    studentCount: int = 0

    class Config:
        from_attributes = True
        populate_by_name = True

# ─── Batches ───────────────────────────────────────────
class BatchCreate(BaseModel):
    courseId: str | None = Field(default=None, alias="course_id")
    name: str
    startDate: str = Field(alias="start_date")
    endDate: str = Field(alias="end_date")
    scheduleTime: str | None = Field(default=None, alias="schedule_time")
    trainerId: str | None = Field(default=None, alias="trainer_id")

    class Config:
        populate_by_name = True

class BatchUpdate(BaseModel):
    courseId: str | None = Field(default=None, alias="course_id")
    name: str | None = None
    startDate: str | None = Field(default=None, alias="start_date")
    endDate: str | None = Field(default=None, alias="end_date")
    scheduleTime: str | None = Field(default=None, alias="schedule_time")
    trainerId: str | None = Field(default=None, alias="trainer_id")
    isActive: bool | None = Field(default=None, alias="is_active")

    class Config:
        populate_by_name = True

class BatchOut(BaseModel):
    id: str
    name: str
    startDate: datetime
    endDate: datetime
    isActive: bool
    scheduleTime: str | None = None
    courseName: str | None = None
    trainerName: str | None = None
    studentCount: int = 0

    class Config:
        from_attributes = True
        populate_by_name = True

# ─── Students ─────────────────────────────────────────
class StudentCreate(BaseModel):
    name: str
    email: str
    phone: str | None = None
    password: str = "welcome123"
    role: str = "STUDENT"

class StudentOut(BaseModel):
    id: str
    name: str
    email: str
    phone: str | None
    studentId: str | None = None
    role: str
    isActive: bool
    createdAt: datetime
    attendancePercentage: int | None = None
    daysPresent: int = 0
    daysAbsent: int = 0
    leavesTaken: int = 0

    class Config:
        from_attributes = True
        populate_by_name = True

# ─── Leads ─────────────────────────────────────────────
class LeadCreate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    source: str | None = None
    notes: str | None = None
    assignedToId: str | None = Field(default=None, alias="assigned_to_id")

    class Config:
        populate_by_name = True

class LeadUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None

class LeadOut(BaseModel):
    id: str
    name: str
    email: str | None
    phone: str | None
    source: str | None
    status: str
    notes: str | None
    assignedToName: str | None = None
    activityCount: int = 0
    createdAt: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

# ─── Attendance ────────────────────────────────────────
class AttendanceRecord(BaseModel):
    studentId: str = Field(alias="student_id")
    batchId: str = Field(alias="batch_id")
    date: str
    status: str

    class Config:
        populate_by_name = True

class AttendanceBulk(BaseModel):
    records: list[AttendanceRecord]

class AttendanceOut(BaseModel):
    id: str
    studentId: str
    studentName: str = ""
    studentSid: str | None = None
    batchId: str
    date: datetime
    status: str

    class Config:
        from_attributes = True
        populate_by_name = True

# ─── Leave ─────────────────────────────────────────────
class LeaveCreate(BaseModel):
    startDate: str = Field(alias="start_date")
    endDate: str = Field(alias="end_date")
    reason: str | None = None

    class Config:
        populate_by_name = True

class LeaveAction(BaseModel):
    id: str
    status: str
    rejectionReason: str | None = Field(default=None, alias="rejection_reason")
    approvedById: str | None = Field(default=None, alias="approved_by_id")

    class Config:
        populate_by_name = True

class LeaveOut(BaseModel):
    id: str
    userName: str = ""
    userRole: str = ""
    userStudentId: str | None = None
    leaveType: str = "OTHER"
    proofUrl: str | None = None
    isCloudinary: bool = False
    startDate: datetime
    endDate: datetime
    reason: str | None
    rejectionReason: str | None = None
    status: str
    approvedByName: str | None = None
    createdAt: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

# ─── Projects / Tasks ─────────────────────────────────
class ProjectCreate(BaseModel):
    batchId: str = Field(alias="batch_id")
    title: str
    description: str | None = None
    deadline: str | None = None

    class Config:
        populate_by_name = True

class TaskOut(BaseModel):
    id: str
    title: str
    status: str
    deadline: datetime | None
    violationFlag: bool = False
    studentName: str | None = None
    studentSid: str | None = None

    class Config:
        from_attributes = True
        populate_by_name = True

class ProjectOut(BaseModel):
    id: str
    title: str
    description: str | None
    deadline: datetime | None
    batchName: str = ""
    taskCount: int = 0
    tasks: list[TaskOut] = []

    class Config:
        from_attributes = True
        populate_by_name = True

# ─── Jobs ──────────────────────────────────────────────
class JobCreate(BaseModel):
    title: str
    company: str
    description: str | None = None
    location: str | None = None
    salary: str | None = None

class JobOut(BaseModel):
    id: str
    title: str
    company: str
    description: str | None
    location: str | None
    salary: str | None
    isActive: bool
    applicationCount: int = 0
    createdAt: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

# ─── Registrations ─────────────────────────────────────
class RegistrationCreate(BaseModel):
    studentId: str = Field(alias="student_id")
    courseId: str = Field(alias="course_id")
    batchId: str | None = Field(default=None, alias="batch_id")
    feeAmount: float = 0
    feePaid: float = 0

    class Config:
        populate_by_name = True

class RegistrationOut(BaseModel):
    id: str
    studentName: str = ""
    studentEmail: str = ""
    studentSid: str | None = None
    courseName: str = ""
    batchName: str | None = None
    feeAmount: float
    feePaid: float
    status: str
    createdAt: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

# ─── Dashboard ─────────────────────────────────────────
class DashboardStats(BaseModel):
    totalStudents: int = Field(default=0, alias="total_students")
    totalCourses: int = Field(default=0, alias="total_courses")
    totalBatches: int = Field(default=0, alias="total_batches")
    totalLeads: int = Field(default=0, alias="total_leads")
    activeJobs: int = Field(default=0, alias="active_jobs")
    pendingLeaves: int = Field(default=0, alias="pending_leaves")
    recentLeads: list[LeadOut] = Field(default=[], alias="recent_leads")

    class Config:
        populate_by_name = True
