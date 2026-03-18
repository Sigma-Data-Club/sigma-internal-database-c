import enum

class DecisionStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    waitlisted = "waitlisted"
    cancelled = "cancelled"

class AttendanceStatus(str, enum.Enum):
    unknown = "unknown"
    attended = "attended"
    no_show = "no_show"

class AttendanceMode(str, enum.Enum):
    in_person = "in_person"
    online = "online"

class ProjectStatus(str, enum.Enum):
    planned = "planned"
    active = "active"
    finished = "finished"
    archived = "archived"

class FinanceTransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"

class ProjectApplicationStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    withdrawn = "withdrawn"