from __future__ import annotations

from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.core.errors import ErrorCode, error_payload
from app.models.enums import ProjectApplicationStatus, ProjectStatus
from app.models.member import Member
from app.models.project import Project
from app.models.project_application import ProjectApplication
from app.models.project_member import ProjectMember


def _validate_project_dates(started_at: date | None, finished_at: date | None) -> None:
    if started_at is not None and finished_at is not None and finished_at < started_at:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error_payload(
                ErrorCode.VALIDATION_ERROR,
                "finished_at must be >= started_at",
                details={"started_at": str(started_at), "finished_at": str(finished_at)},
            ),
        )


class ProjectService:
    @staticmethod
    def get_member(db: Session, *, member_id: int) -> Member:
        obj = db.get(Member, member_id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Member not found",
                    details={"member_id": member_id},
                ),
            )
        return obj

    @staticmethod
    def list_projects(
        db: Session,
        *,
        q: str | None,
        status_: ProjectStatus | None,
        limit: int,
        offset: int,
    ) -> tuple[list[Project], int]:
        stmt = select(Project)
        count_stmt = select(func.count()).select_from(Project)

        if status_ is not None:
            stmt = stmt.where(Project.status == status_)
            count_stmt = count_stmt.where(Project.status == status_)

        if q:
            like = f"%{q.strip()}%"
            stmt = stmt.where(Project.name.ilike(like))
            count_stmt = count_stmt.where(Project.name.ilike(like))

        total = db.scalar(count_stmt) or 0
        items = db.scalars(
            stmt.order_by(Project.project_id.desc()).offset(offset).limit(limit)
        ).all()

        return items, total

    @staticmethod
    def get_project(db: Session, *, project_id: int) -> Project:
        obj = db.get(Project, project_id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Project not found",
                    details={"project_id": project_id},
                ),
            )
        return obj

    @staticmethod
    def create_project(
        db: Session,
        *,
        name: str,
        description: str | None,
        status_: ProjectStatus,
        started_at: date | None,
        finished_at: date | None,
    ) -> Project:
        _validate_project_dates(started_at, finished_at)

        obj = Project(
            name=name,
            description=description,
            status=status_,
            started_at=started_at,
            finished_at=finished_at,
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def put_project(
        db: Session,
        *,
        project_id: int,
        name: str,
        description: str | None,
        status_: ProjectStatus,
        started_at: date | None,
        finished_at: date | None,
    ) -> Project:
        _validate_project_dates(started_at, finished_at)

        obj = ProjectService.get_project(db, project_id=project_id)
        obj.name = name
        obj.description = description
        obj.status = status_
        obj.started_at = started_at
        obj.finished_at = finished_at

        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def patch_project(
        db: Session,
        *,
        project_id: int,
        name: str | None,
        description: str | None,
        status_: ProjectStatus | None,
        started_at: date | None,
        finished_at: date | None,
    ) -> Project:
        obj = ProjectService.get_project(db, project_id=project_id)

        new_started = started_at if started_at is not None else obj.started_at
        new_finished = finished_at if finished_at is not None else obj.finished_at
        _validate_project_dates(new_started, new_finished)

        if name is not None:
            obj.name = name
        if description is not None:
            obj.description = description
        if status_ is not None:
            obj.status = status_
        if started_at is not None:
            obj.started_at = started_at
        if finished_at is not None:
            obj.finished_at = finished_at

        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def delete_project(db: Session, *, project_id: int) -> None:
        obj = ProjectService.get_project(db, project_id=project_id)
        db.delete(obj)
        db.commit()

    @staticmethod
    def list_project_members(
        db: Session,
        *,
        project_id: int,
        limit: int,
        offset: int,
    ) -> tuple[list[ProjectMember], int]:
        ProjectService.get_project(db, project_id=project_id)

        count_stmt = (
            select(func.count())
            .select_from(ProjectMember)
            .where(ProjectMember.project_id == project_id)
        )
        total = db.scalar(count_stmt) or 0

        items = db.scalars(
            select(ProjectMember)
            .where(ProjectMember.project_id == project_id)
            .order_by(ProjectMember.joined_at.desc())
            .offset(offset)
            .limit(limit)
        ).all()

        return items, total

    @staticmethod
    def get_project_member(db: Session, *, project_id: int, member_id: int) -> ProjectMember:
        ProjectService.get_project(db, project_id=project_id)

        obj = db.get(ProjectMember, {"project_id": project_id, "member_id": member_id})
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Project member not found",
                    details={"project_id": project_id, "member_id": member_id},
                ),
            )
        return obj

    @staticmethod
    def add_project_member(
        db: Session,
        *,
        project_id: int,
        member_id: int,
        project_role: str,
    ) -> ProjectMember:
        ProjectService.get_project(db, project_id=project_id)
        ProjectService.get_member(db, member_id=member_id)

        existing = db.get(ProjectMember, {"project_id": project_id, "member_id": member_id})
        if existing:
            return existing

        obj = ProjectMember(
            project_id=project_id,
            member_id=member_id,
            project_role=project_role,
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def patch_project_member(
        db: Session,
        *,
        project_id: int,
        member_id: int,
        project_role: str | None,
        left_at,
    ) -> ProjectMember:
        obj = ProjectService.get_project_member(db, project_id=project_id, member_id=member_id)

        if left_at is not None and obj.joined_at is not None and left_at < obj.joined_at:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "left_at must be >= joined_at",
                    details={
                        "joined_at": obj.joined_at.isoformat(),
                        "left_at": left_at.isoformat(),
                    },
                ),
            )

        if project_role is not None:
            obj.project_role = project_role
        if left_at is not None:
            obj.left_at = left_at

        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def remove_project_member(db: Session, *, project_id: int, member_id: int) -> None:
        obj = ProjectService.get_project_member(db, project_id=project_id, member_id=member_id)
        db.delete(obj)
        db.commit()

    @staticmethod
    def get_project_application(
        db: Session,
        *,
        project_id: int,
        application_id: int,
    ) -> ProjectApplication:
        ProjectService.get_project(db, project_id=project_id)

        obj = db.get(ProjectApplication, application_id)
        if not obj or obj.project_id != project_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Project application not found",
                    details={"project_id": project_id, "application_id": application_id},
                ),
            )
        return obj

    @staticmethod
    def list_project_applications(
        db: Session,
        *,
        project_id: int,
        status_: ProjectApplicationStatus | None,
        limit: int,
        offset: int,
    ) -> tuple[list[ProjectApplication], int]:
        ProjectService.get_project(db, project_id=project_id)

        stmt = select(ProjectApplication).where(ProjectApplication.project_id == project_id)
        count_stmt = (
            select(func.count())
            .select_from(ProjectApplication)
            .where(ProjectApplication.project_id == project_id)
        )

        if status_ is not None:
            stmt = stmt.where(ProjectApplication.status == status_)
            count_stmt = count_stmt.where(ProjectApplication.status == status_)

        total = db.scalar(count_stmt) or 0

        items = db.scalars(
            stmt.order_by(ProjectApplication.created_at.desc())
            .offset(offset)
            .limit(limit)
        ).all()

        return items, total

    @staticmethod
    def create_project_application(
        db: Session,
        *,
        project_id: int,
        member_id: int,
        desired_role: str,
        application_text: str,
    ) -> ProjectApplication:
        project = ProjectService.get_project(db, project_id=project_id)
        ProjectService.get_member(db, member_id=member_id)

        if project.status in {ProjectStatus.finished, ProjectStatus.archived}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Applications are not allowed for this project status",
                    details={"project_status": project.status.value},
                ),
            )

        existing_member = db.get(ProjectMember, {"project_id": project_id, "member_id": member_id})
        if existing_member and existing_member.left_at is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Member is already active in this project",
                    details={"project_id": project_id, "member_id": member_id},
                ),
            )

        pending_exists = db.scalar(
            select(func.count())
            .select_from(ProjectApplication)
            .where(ProjectApplication.project_id == project_id)
            .where(ProjectApplication.member_id == member_id)
            .where(ProjectApplication.status == ProjectApplicationStatus.pending)
        ) or 0

        if pending_exists:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Pending application already exists",
                    details={"project_id": project_id, "member_id": member_id},
                ),
            )

        obj = ProjectApplication(
            project_id=project_id,
            member_id=member_id,
            desired_role=desired_role,
            application_text=application_text,
            status=ProjectApplicationStatus.pending,
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def decide_project_application(
        db: Session,
        *,
        project_id: int,
        application_id: int,
        decided_by_member_id: int,
        status_: ProjectApplicationStatus,
        manager_note: str | None,
    ) -> ProjectApplication:
        if status_ not in {
            ProjectApplicationStatus.accepted,
            ProjectApplicationStatus.rejected,
        }:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Decision status must be accepted or rejected",
                    details={"status": status_.value},
                ),
            )

        ProjectService.get_member(db, member_id=decided_by_member_id)
        obj = ProjectService.get_project_application(
            db,
            project_id=project_id,
            application_id=application_id,
        )

        if obj.status != ProjectApplicationStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Only pending applications can be decided",
                    details={"application_id": application_id, "status": obj.status.value},
                ),
            )

        obj.status = status_
        obj.manager_note = manager_note
        obj.reviewed_at = datetime.now(timezone.utc)
        obj.reviewed_by_member_id = decided_by_member_id

        if status_ == ProjectApplicationStatus.accepted:
            existing_member = db.get(
                ProjectMember,
                {"project_id": obj.project_id, "member_id": obj.member_id},
            )

            if existing_member:
                existing_member.project_role = obj.desired_role
                existing_member.left_at = None
                db.add(existing_member)
            else:
                db.add(
                    ProjectMember(
                        project_id=obj.project_id,
                        member_id=obj.member_id,
                        project_role=obj.desired_role,
                    )
                )

        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def withdraw_project_application(
        db: Session,
        *,
        project_id: int,
        application_id: int,
        member_id: int,
    ) -> ProjectApplication:
        obj = ProjectService.get_project_application(
            db,
            project_id=project_id,
            application_id=application_id,
        )

        if obj.member_id != member_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "You can withdraw only your own application",
                    details={"application_id": application_id, "member_id": member_id},
                ),
            )

        if obj.status != ProjectApplicationStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=error_payload(
                    ErrorCode.VALIDATION_ERROR,
                    "Only pending applications can be withdrawn",
                    details={"application_id": application_id, "status": obj.status.value},
                ),
            )

        obj.status = ProjectApplicationStatus.withdrawn
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def list_active_projects(
        db: Session,
        *,
        q: str | None,
        limit: int,
        offset: int,
    ) -> tuple[list[Project], int]:
        return ProjectService.list_projects(
            db,
            q=q,
            status_=ProjectStatus.active,
            limit=limit,
            offset=offset,
        )

    @staticmethod
    def get_project_stats(db: Session, *, project_id: int):
        ProjectService.get_project(db, project_id=project_id)

        members_total = db.scalar(
            select(func.count())
            .select_from(ProjectMember)
            .where(ProjectMember.project_id == project_id)
        ) or 0

        members_active = db.scalar(
            select(func.count())
            .select_from(ProjectMember)
            .where(ProjectMember.project_id == project_id)
            .where(ProjectMember.left_at.is_(None))
        ) or 0

        applications_pending = db.scalar(
            select(func.count())
            .select_from(ProjectApplication)
            .where(ProjectApplication.project_id == project_id)
            .where(ProjectApplication.status == ProjectApplicationStatus.pending)
        ) or 0

        finance_income_total = None
        finance_expense_total = None
        finance_balance = None

        try:
            from app.models.finance_transaction import FinanceTransaction
            from app.models.enums import FinanceTransactionType
        except Exception:
            FinanceTransaction = None  # type: ignore

        if FinanceTransaction is not None:
            income_sum = func.coalesce(
                func.sum(
                    case(
                        (
                            FinanceTransaction.type == FinanceTransactionType.income,
                            FinanceTransaction.amount_cents,
                        ),
                        else_=0,
                    )
                ),
                0,
            )
            expense_sum = func.coalesce(
                func.sum(
                    case(
                        (
                            FinanceTransaction.type == FinanceTransactionType.expense,
                            FinanceTransaction.amount_cents,
                        ),
                        else_=0,
                    )
                ),
                0,
            )

            row = db.execute(
                select(income_sum, expense_sum).where(FinanceTransaction.project_id == project_id)
            ).one()

            finance_income_total = int(row[0] or 0)
            finance_expense_total = int(row[1] or 0)
            finance_balance = finance_income_total - finance_expense_total

        return {
            "members_total": int(members_total),
            "members_active": int(members_active),
            "applications_pending": int(applications_pending),
            "finance_income_total": finance_income_total,
            "finance_expense_total": finance_expense_total,
            "finance_balance": finance_balance,
        }

    @staticmethod
    def get_project_summary(db: Session, *, project_id: int):
        project = ProjectService.get_project(db, project_id=project_id)
        stats = ProjectService.get_project_stats(db, project_id=project_id)
        return {"project": project, "stats": stats}