'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useUserProfile } from '@/context/profile-context';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAllDifficultyLevelsOptions,
  getCategoryByUuidOptions,
  getClassDefinitionOptions,
  getCourseByUuidOptions,
  getEnrollmentOverviewForStudentOptions,
  getStudentCertificatesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Category,
  Certificate,
  ClassDefinition,
  Course,
  DifficultyLevel,
  StudentClassEnrollmentSummary,
  StudentCourseEnrollmentSummary,
} from '@/services/client/types.gen';

import type {
  CredentialRecord,
  AchievementRecord,
  CompetencyRecord,
  ExperienceRecord,
  PortfolioRecord,
  SkillRecord,
  SkillsWalletData,
  VerificationEventRecord,
} from './SkillsWalletShared';
import { ICON_MAP, fmtMonth } from './SkillsWalletShared';

type OptionalGeneratedQueryOptions = {
  queryKey: readonly unknown[];
  queryFn?: unknown;
};

function useOptionalGeneratedQuery(
  options: OptionalGeneratedQueryOptions | null,
  disabledKey: readonly unknown[]
) {
  return useQuery({
    queryKey: options?.queryKey ?? disabledKey,
    queryFn: context =>
      typeof options?.queryFn === 'function'
        ? Promise.resolve(options.queryFn(context as never))
        : Promise.resolve(null),
    enabled: Boolean(options),
  });
}

const getLevelLabel = (difficulty?: DifficultyLevel | null) =>
  difficulty?.name ?? difficulty?.display_name ?? '';

const getSkillIconKey = (value: string) => {
  const normalized = value.toLowerCase();

  if (normalized.includes('design')) return 'Palette';
  if (normalized.includes('data') || normalized.includes('analytics')) return 'BarChart3';
  if (normalized.includes('cloud')) return 'Cloud';
  if (normalized.includes('marketing') || normalized.includes('sales')) return 'Megaphone';
  if (normalized.includes('speaking') || normalized.includes('presentation')) return 'Mic';
  if (normalized.includes('management') || normalized.includes('project')) return 'Rocket';
  if (normalized.includes('communication') || normalized.includes('writing')) return 'BookOpen';

  return 'Code2';
};

const getTint = (value: string) => {
  const normalized = value.toLowerCase();

  if (normalized.includes('design')) return 'bg-secondary text-secondary-foreground';
  if (normalized.includes('data') || normalized.includes('analytics')) return 'bg-primary/10 text-primary';
  if (normalized.includes('cloud')) return 'bg-primary/10 text-primary';
  if (normalized.includes('marketing') || normalized.includes('sales')) return 'bg-warning/10 text-warning';
  if (normalized.includes('speaking') || normalized.includes('presentation')) return 'bg-warning/10 text-warning';
  if (normalized.includes('management') || normalized.includes('project')) return 'bg-success/10 text-success';

  return 'bg-muted text-muted-foreground';
};

const unique = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

const average = (values: number[]) =>
  values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;

const getLevelNumber = (level: string) => {
  const normalized = level.toLowerCase();

  if (normalized.includes('expert')) return 'L4';
  if (normalized.includes('advanced')) return 'L3';
  if (normalized.includes('intermediate')) return 'L2';
  return 'L1';
};

const clampPct = (value?: number | null) => Math.max(0, Math.min(100, Math.round(value ?? 0)));

const getDateTimeValue = (value?: Date | string | null) => {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const inferExperienceCategory = (label: string) => {
  const normalized = label.toLowerCase();

  if (normalized.includes('intern')) return 'internship' as const;
  if (normalized.includes('volunteer') || normalized.includes('community')) return 'volunteer' as const;
  if (
    normalized.includes('job') ||
    normalized.includes('role') ||
    normalized.includes('career') ||
    normalized.includes('work')
  ) {
    return 'work' as const;
  }

  return 'project' as const;
};

const inferExperienceTags = (parts: Array<string | null | undefined>) =>
  unique(parts.map(part => part?.trim()).filter((value): value is string => Boolean(value)));

const inferVerificationSource = (title: string, category?: string | null) => {
  const normalized = `${title} ${category ?? ''}`.toLowerCase();
  if (
    normalized.includes('hackathon') ||
    normalized.includes('competition') ||
    normalized.includes('contest') ||
    normalized.includes('challenge')
  ) {
    return 'competition' as const;
  }

  if (
    normalized.includes('review') ||
    normalized.includes('evaluation') ||
    normalized.includes('instructor') ||
    normalized.includes('class')
  ) {
    return 'instructor_evaluation' as const;
  }

  return 'assessment' as const;
};

export function useStudentSkillsWalletData() {
  const profile = useUserProfile();
  const student = profile?.student;
  const studentUuid = student?.uuid;

  const overviewQuery = useOptionalGeneratedQuery(
    studentUuid
      ? getEnrollmentOverviewForStudentOptions({
        path: { studentUuid },
        query: { pageable: { page: 0, size: 50 } },
      })
      : null,
    ['skills-wallet', 'overview', 'disabled']
  );

  const certificatesQuery = useOptionalGeneratedQuery(
    studentUuid ? getStudentCertificatesOptions({ path: { studentUuid } }) : null,
    ['skills-wallet', 'certificates', 'disabled']
  );

  const difficultyLevelsQuery = useQuery({
    ...getAllDifficultyLevelsOptions(),
    staleTime: STALE_TIMES.reference,
  });

  const certificates = (certificatesQuery.data?.data ?? []) as Certificate[];
  const validCertificates = certificates.filter(certificate => certificate.is_valid !== false);
  const overview = overviewQuery.data?.data;

  const courseEnrollments = (overview?.course_enrollments?.content ?? []) as StudentCourseEnrollmentSummary[];
  const classEnrollments = (overview?.class_enrollments?.content ?? []) as StudentClassEnrollmentSummary[];

  const classDefinitionUuids = useMemo(
    () => unique(classEnrollments.map(enrollment => enrollment.class_definition_uuid)),
    [classEnrollments]
  );

  const classDefinitionQueries = useQueries({
    queries: classDefinitionUuids.map(uuid => ({
      ...getClassDefinitionOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: STALE_TIMES.entity,
    })),
  });

  const classDefinitionMap = useMemo(() => {
    const map = new Map<string, ClassDefinition>();

    classDefinitionQueries.forEach((query, index) => {
      const classDefinition = query.data?.data?.class_definition;
      const uuid = classDefinitionUuids[index];

      if (classDefinition && uuid) {
        map.set(uuid, classDefinition);
      }
    });

    return map;
  }, [classDefinitionQueries, classDefinitionUuids]);

  const courseProgressByClassAverage = useMemo(() => {
    const grouped = new Map<string, number[]>();

    classEnrollments.forEach(enrollment => {
      const classDefinition = classDefinitionMap.get(enrollment.class_definition_uuid);
      const courseUuid = classDefinition?.course_uuid;
      const classProgress = classDefinition?.class_progress_percentage;

      if (!courseUuid || typeof classProgress !== 'number') return;

      const values = grouped.get(courseUuid) ?? [];
      values.push(classProgress);
      grouped.set(courseUuid, values);
    });

    const map = new Map<string, number>();

    grouped.forEach((values, courseUuid) => {
      const avg = average(values);
      if (avg !== null) {
        map.set(courseUuid, avg);
      }
    });

    return map;
  }, [classDefinitionMap, classEnrollments]);

  const courseUuids = useMemo(
    () =>
      unique([
        ...courseEnrollments.map(enrollment => enrollment.course_uuid),
        ...classEnrollments
          .map(enrollment => classDefinitionMap.get(enrollment.class_definition_uuid)?.course_uuid)
          .filter((value): value is string => Boolean(value)),
      ]),
    [classDefinitionMap, classEnrollments, courseEnrollments]
  );

  const courseQueries = useQueries({
    queries: courseUuids.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: STALE_TIMES.entity,
    })),
  });

  const courseMap = useMemo(() => {
    const map = new Map<string, Course>();

    courseQueries.forEach((query, index) => {
      const course = query.data?.data;
      const uuid = courseUuids[index];

      if (course && uuid) {
        map.set(uuid, course);
      }
    });

    return map;
  }, [courseQueries, courseUuids]);

  const categoryUuids = useMemo(
    () =>
      unique(
        Array.from(courseMap.values()).flatMap(course => course.category_uuids ?? [])
      ),
    [courseMap]
  );

  const categoryQueries = useQueries({
    queries: categoryUuids.map(uuid => ({
      ...getCategoryByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: STALE_TIMES.reference,
    })),
  });

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();

    categoryQueries.forEach((query, index) => {
      const category = query.data?.data;
      const uuid = categoryUuids[index];

      if (category && uuid) {
        map.set(uuid, category);
      }
    });

    return map;
  }, [categoryQueries, categoryUuids]);

  const difficultyLevelMap = useMemo(() => {
    const map = new Map<string, DifficultyLevel>();
    const levels = (difficultyLevelsQuery.data?.data ?? []) as DifficultyLevel[];

    levels.forEach(level => {
      if (!level.uuid) return;
      map.set(level.uuid, level);
    });

    return map;
  }, [difficultyLevelsQuery.data?.data]);

  const certificatesByCourse = useMemo(() => {
    const map = new Map<string, Certificate>();

    validCertificates.forEach(certificate => {
      if (certificate.course_uuid && !map.has(certificate.course_uuid)) {
        map.set(certificate.course_uuid, certificate);
      }
    });

    return map;
  }, [validCertificates]);

  const skills = useMemo<SkillRecord[]>(() => {
    const byCourse = new Map<string, SkillRecord>();

    courseEnrollments.forEach(enrollment => {
      const course = courseMap.get(enrollment.course_uuid);
      if (!course) return;

      const difficulty = course.difficulty_uuid ? difficultyLevelMap.get(course.difficulty_uuid) : undefined;
      const certificate = certificatesByCourse.get(course.uuid ?? enrollment.course_uuid);
      const categoryUuid = course.category_uuids?.[0];
      const category = categoryUuid ? categoryMap.get(categoryUuid) : undefined;
      const classAverageProgress = courseProgressByClassAverage.get(enrollment.course_uuid);
      const progress = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            classAverageProgress ??
            enrollment.progress_percentage ??
            certificate?.final_grade ??
            (certificate ? 100 : 0)
          )
        )
      );

      byCourse.set(enrollment.course_uuid, {
        id: enrollment.enrollment_uuid ?? enrollment.course_uuid,
        name: course.name,
        level: getLevelLabel(difficulty),
        proficiency_pct: progress,
        category: category?.name ?? categoryUuid ?? 'General',
        last_used: fmtMonth(enrollment.updated_date ?? certificate?.issued_date ?? certificate?.completion_date),
        icon_key: getSkillIconKey(category?.name ?? course.name),
        icon: ICON_MAP[getSkillIconKey(category?.name ?? course.name)],
        tint: getTint(category?.name ?? course.name),
        course_uuid: course.uuid ?? enrollment.course_uuid,
        course_title: course.name,
        class_title: undefined,
      });
    });

    classEnrollments.forEach(enrollment => {
      const classDefinition = classDefinitionMap.get(enrollment.class_definition_uuid);
      const courseUuid = classDefinition?.course_uuid;
      if (!courseUuid || byCourse.has(courseUuid)) return;

      const course = courseMap.get(courseUuid);
      if (!course) return;

      const difficulty = course.difficulty_uuid ? difficultyLevelMap.get(course.difficulty_uuid) : undefined;

      const categoryUuid = course.category_uuids?.[0];
      const category = categoryUuid ? categoryMap.get(categoryUuid) : undefined;
      const classAverageProgress = courseProgressByClassAverage.get(courseUuid);

      byCourse.set(courseUuid, {
        id: enrollment.latest_enrollment_uuid ?? courseUuid,
        name: course.name,
        level: getLevelLabel(difficulty),
        proficiency_pct:
          classAverageProgress ??
          (enrollment.latest_enrollment_status ? 70 : 45),
        category: category?.name ?? categoryUuid ?? 'General',
        last_used: fmtMonth(enrollment.latest_activity_date ?? enrollment.latest_scheduled_instance_start_time),
        icon_key: getSkillIconKey(category?.name ?? course.name),
        icon: ICON_MAP[getSkillIconKey(category?.name ?? course.name)],
        tint: getTint(category?.name ?? course.name),
        course_uuid: course.uuid ?? courseUuid,
        course_title: course.name,
        class_title: classDefinition?.title ?? enrollment.class_title ?? undefined,
      });
    });

    return Array.from(byCourse.values())
      .sort((a, b) => b.proficiency_pct - a.proficiency_pct)
      .map((item, index) => ({
        ...item,
        proficiency_pct: index === 0 && item.proficiency_pct < 90 ? Math.max(item.proficiency_pct, 90) : item.proficiency_pct,
      }));
  }, [categoryMap, certificatesByCourse, classDefinitionMap, classEnrollments, courseEnrollments, courseMap, courseProgressByClassAverage, difficultyLevelMap]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();

    skills.forEach(skill => {
      map.set(skill.category, (map.get(skill.category) ?? 0) + 1);
    });

    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
      colorClass:
        name.toLowerCase().includes('design')
          ? 'bg-secondary'
          : name.toLowerCase().includes('data')
            ? 'bg-primary'
            : name.toLowerCase().includes('cloud')
              ? 'bg-success'
              : 'bg-warning',
    }));
  }, [skills]);

  const levelCounts = useMemo(() => {
    const map = new Map<string, number>();

    skills.forEach(skill => {
      map.set(skill.level, (map.get(skill.level) ?? 0) + 1);
    });

    const order = Array.from(difficultyLevelMap.values()).sort(
      (a, b) => a.level_order - b.level_order
    );

    return (order.length
      ? order
      : Array.from(map.keys()).map(name => ({ name, display_name: name, level_order: 0 } as DifficultyLevel))
    ).map(level => {
      const label = level.name ?? level.display_name;

      return {
        name: label,
        count: map.get(label) ?? map.get(level.name ?? '') ?? 0,
      };
    });
  }, [difficultyLevelMap, skills]);


  const averageProgress = skills.length
    ? Math.round(skills.reduce((sum, skill) => sum + skill.proficiency_pct, 0) / skills.length)
    : 0;
  const completedSkills = skills.filter(skill => skill.proficiency_pct >= 100).length;
  const activeSkills = skills.filter(skill => skill.proficiency_pct > 0 && skill.proficiency_pct < 100).length;
  const verifiedCount = validCertificates.length;
  const newSkillsThisMonth = validCertificates.filter(certificate => {
    const completionDate = certificate.completion_date ? new Date(certificate.completion_date) : null;
    if (!completionDate || Number.isNaN(completionDate.getTime())) return false;
    const now = new Date();
    return completionDate.getMonth() === now.getMonth() && completionDate.getFullYear() === now.getFullYear();
  }).length;

  const overviewMetrics = {
    skillsProgress: averageProgress,
    verifiedSkills: verifiedCount,
    newSkillsThisMonth,
    totalSkills: skills.length,
    completedSkills,
    activeSkills,
    courseEnrollments: courseEnrollments.length,
    classEnrollments: classEnrollments.length,
  };

  const levelBreakdown = levelCounts;
  const topSkills = skills.slice(0, 5);

  const competencies = useMemo<CompetencyRecord[]>(() => {
    const records = new Map<string, CompetencyRecord>();

    skills.forEach(skill => {
      const certificate = skill.course_uuid ? certificatesByCourse.get(skill.course_uuid) : undefined;
      const hasClassEvidence = Boolean(skill.class_title);
      const hasAssessmentEvidence = Boolean(certificate) && !hasClassEvidence;
      const isCompleted = skill.proficiency_pct >= 100 || hasClassEvidence || hasAssessmentEvidence;

      if (!isCompleted) return;

      const source = hasClassEvidence ? 'class' : 'assessment';
      const recordId = `${source}-${skill.course_uuid ?? skill.id}`;

      if (records.has(recordId)) return;

      records.set(recordId, {
        id: recordId,
        competency: skill.course_title ? `${skill.course_title} Completion` : `${skill.name} Completion`,
        skill: skill.name,
        level: skill.level || 'Completed',
        level_num: getLevelNumber(skill.level || 'Completed'),
        pct: skill.proficiency_pct,
        evidence_count: source === 'class' ? 1 : 1,
        last_updated: skill.last_used ?? fmtMonth(certificate?.issued_date ?? certificate?.completion_date),
        course_id: source === 'class' ? skill.course_uuid ?? null : null,
        assessment_id: source === 'assessment' ? (certificate?.uuid ?? skill.course_uuid ?? null) : null,
        badge: source === 'class'
          ? `${skill.course_title ?? skill.name} Badge`
          : `${skill.course_title ?? skill.name} Assessment Badge`,
        source,
        course_title: skill.course_title ?? null,
        class_title: skill.class_title ?? null,
      });
    });

    return Array.from(records.values()).sort((a, b) => b.pct - a.pct);
  }, [certificatesByCourse, skills]);



  const credentials: CredentialRecord[] = [
    ...validCertificates.map((certificate, index) => ({
      id: certificate.uuid ?? `cert-${index}`,
      name: certificate.course_uuid ? courseMap.get(certificate.course_uuid)?.name ?? 'Certificate' : 'Program Certificate',
      org: certificate.course_uuid
        ? 'Platform credential'
        : 'Platform credential',
      issued_at: certificate.issued_date ? certificate.issued_date.toString() : certificate.completion_date.toString(),
      credential_code: certificate.certificate_number ?? certificate.template_uuid,
      status: 'Verified' as const,
      source: 'platform' as const,
    })),
  ];

  const externalCertificates: CredentialRecord[] = [];

  const experiences = useMemo(() => {
    const records = new Map<string, ExperienceRecord>();
    const classCourseUuids = new Set(
      Array.from(classDefinitionMap.values())
        .map(definition => definition.course_uuid)
        .filter((value): value is string => Boolean(value))
    );

    classEnrollments.forEach(enrollment => {
      const classDefinition = classDefinitionMap.get(enrollment.class_definition_uuid);
      const courseUuid = classDefinition?.course_uuid;
      const course = courseUuid ? courseMap.get(courseUuid) : undefined;
      if (!course) return;

      const certificate = certificatesByCourse.get(course.uuid ?? courseUuid);
      const classAverageProgress = courseProgressByClassAverage.get(courseUuid);
      const progress = clampPct(
        classAverageProgress ??
          classDefinition?.class_progress_percentage ??
          (enrollment.latest_enrollment_status ? 70 : 0)
      );
      const role = classDefinition?.title ?? enrollment.class_title ?? course.name;
      const sortKey = getDateTimeValue(
        enrollment.latest_activity_date ?? enrollment.latest_scheduled_instance_start_time ?? certificate?.completion_date
      );
      const label = role || course.name;
      const category = inferExperienceCategory(label);

      records.set(`class-${enrollment.class_definition_uuid}`, {
        id: `class-${enrollment.class_definition_uuid}`,
        role,
        org: course.category_uuids?.length ? (categoryMap.get(course.category_uuids[0] ?? '')?.name ?? 'Elimika Learning Journey') : 'Elimika Learning Journey',
        start_date: (enrollment.latest_scheduled_instance_start_time ?? enrollment.latest_activity_date ?? certificate?.completion_date ?? new Date()).toString(),
        end_date: certificate?.completion_date ? certificate.completion_date.toString() : null,
        is_current: !certificate || progress < 100,
        description: certificate
          ? `Class progress ${progress}% with a verified completion record.`
          : `Class progress ${progress}% tracked from your live enrolment activity.`,
        tags: inferExperienceTags([
          course.category_uuids?.length ? categoryMap.get(course.category_uuids[0] ?? '')?.name : undefined,
          course.difficulty_uuid ? getLevelLabel(difficultyLevelMap.get(course.difficulty_uuid)) : undefined,
          certificate ? 'Verified' : 'In progress',
        ]),
        category,
        sort_order: sortKey,
      });
    });

    courseEnrollments.forEach(enrollment => {
      const course = courseMap.get(enrollment.course_uuid);
      if (!course || classCourseUuids.has(course.uuid ?? enrollment.course_uuid)) return;

      const certificate = certificatesByCourse.get(course.uuid ?? enrollment.course_uuid);
      const categoryUuid = course.category_uuids?.[0];
      const category = categoryUuid ? categoryMap.get(categoryUuid) : undefined;
      const progress = clampPct(
        certificate?.final_grade ??
          enrollment.progress_percentage ??
          (certificate ? 100 : enrollment.enrollment_status ? 70 : 0)
      );
      const label = course.name;
      const sortKey = getDateTimeValue(enrollment.updated_date ?? certificate?.issued_date ?? certificate?.completion_date);

      records.set(`course-${enrollment.enrollment_uuid ?? enrollment.course_uuid}`, {
        id: `course-${enrollment.enrollment_uuid ?? enrollment.course_uuid}`,
        role: label,
        org: category?.name ?? 'Elimika Learning Journey',
        start_date: (enrollment.updated_date ?? certificate?.completion_date ?? new Date()).toString(),
        end_date: certificate?.completion_date ? certificate.completion_date.toString() : null,
        is_current: !certificate || progress < 100,
        description: certificate
          ? `Completed from a live course enrolment with ${progress}% final performance.`
          : `Course enrolment progress currently at ${progress}%.`,
        tags: inferExperienceTags([
          category?.name,
          getLevelLabel(course.difficulty_uuid ? difficultyLevelMap.get(course.difficulty_uuid) : undefined),
          certificate ? 'Certificate earned' : 'Learning',
        ]),
        category: inferExperienceCategory(label),
        sort_order: sortKey,
      });
    });

    return Array.from(records.values()).sort((a, b) => b.sort_order - a.sort_order);
  }, [
    certificatesByCourse,
    categoryMap,
    classDefinitionMap,
    classEnrollments,
    courseEnrollments,
    courseMap,
    difficultyLevelMap,
  ]);

  const achievements = useMemo<AchievementRecord[]>(() => {
    const certificateAchievements = validCertificates.map((certificate, index) => {
      const course = certificate.course_uuid ? courseMap.get(certificate.course_uuid) : undefined;
      const categoryUuid = course?.category_uuids?.[0];
      const category = categoryUuid ? categoryMap.get(categoryUuid) : undefined;
      const points = clampPct(certificate.final_grade ?? 100);

      return {
        id: certificate.uuid ?? `achievement-${index}`,
        name: course?.name ?? certificate.certificate_type ?? 'Learning Milestone',
        description: course
          ? `Completed ${course.name}${certificate.final_grade != null ? ` with a ${certificate.final_grade}% grade` : ''}.`
          : `Issued on ${fmtMonth(certificate.issued_date ?? certificate.completion_date)}.`,
        points,
        achieved_at: certificate.completion_date?.toString() ?? certificate.issued_date?.toString() ?? null,
        status: 'Completed' as const,
        color_key:
          category?.name?.toLowerCase().includes('design')
            ? 'bg-secondary'
            : category?.name?.toLowerCase().includes('data')
              ? 'bg-primary'
              : category?.name?.toLowerCase().includes('cloud')
                ? 'bg-success'
                : 'bg-warning',
        progress: null,
      } satisfies AchievementRecord;
    });

    const progressPct = overviewMetrics.totalSkills
      ? Math.round((overviewMetrics.completedSkills / overviewMetrics.totalSkills) * 100)
      : null;

    const journeyAchievement = overviewMetrics.totalSkills > 0 || overviewMetrics.courseEnrollments > 0
      ? [{
        id: 'learning-journey',
        name: 'Learning Journey',
        description: `${overviewMetrics.completedSkills} of ${overviewMetrics.totalSkills} skills completed across ${overviewMetrics.courseEnrollments} live course enrolments.`,
        points: overviewMetrics.completedSkills * 25,
        achieved_at: null,
        status: overviewMetrics.totalSkills > 0 && overviewMetrics.completedSkills === overviewMetrics.totalSkills ? 'Completed' as const : 'In Progress' as const,
        color_key: 'bg-primary',
        progress: progressPct,
      } satisfies AchievementRecord]
      : [];

    return [...certificateAchievements, ...journeyAchievement];
  }, [categoryMap, courseMap, overviewMetrics.completedSkills, overviewMetrics.courseEnrollments, overviewMetrics.totalSkills, validCertificates]);

  const verificationEvents = useMemo<VerificationEventRecord[]>(() => {
    const records: VerificationEventRecord[] = [];

    validCertificates.forEach((certificate, index) => {
      const course = certificate.course_uuid ? courseMap.get(certificate.course_uuid) : undefined;
      const categoryUuid = course?.category_uuids?.[0];
      const category = categoryUuid ? categoryMap.get(categoryUuid) : undefined;
      const title = course?.name ?? certificate.certificate_type ?? 'Certificate';
      const source = inferVerificationSource(title, category?.name);

      records.push({
        id: `cert-${certificate.uuid ?? index}`,
        source,
        title,
        skill: category?.name ?? course?.name ?? 'General',
        change: certificate.final_grade != null
          ? `Final grade ${certificate.final_grade}% · Certificate issued`
          : 'Certificate issued from live completion data',
        date: (certificate.issued_date ?? certificate.completion_date).toString(),
        status: certificate.is_valid === false ? 'failed' : 'verified',
      });
    });

    classEnrollments.forEach((enrollment, index) => {
      const classDefinition = classDefinitionMap.get(enrollment.class_definition_uuid);
      const courseUuid = classDefinition?.course_uuid;
      const course = courseUuid ? courseMap.get(courseUuid) : undefined;
      if (!course) return;

      const classAverageProgress = courseProgressByClassAverage.get(courseUuid);
      const progress = clampPct(
        classAverageProgress ??
          classDefinition?.class_progress_percentage ??
          (enrollment.latest_enrollment_status ? 70 : 0)
      );
      const isVerified = progress >= 100 || enrollment.latest_enrollment_status?.toString().toLowerCase().includes('complete');

      records.push({
        id: `class-${enrollment.class_definition_uuid}-${index}`,
        source: 'instructor_evaluation',
        title: classDefinition?.title ?? enrollment.class_title ?? course.name,
        skill: course.name,
        change: isVerified
          ? `Instructor sign-off confirmed at ${progress}% completion`
          : `Instructor review pending at ${progress}% completion`,
        date: (enrollment.latest_activity_date ?? enrollment.latest_scheduled_instance_start_time ?? new Date()).toString(),
        status: isVerified ? 'verified' : 'pending',
      });
    });

    return records.sort((a, b) => getDateTimeValue(b.date) - getDateTimeValue(a.date));
  }, [categoryMap, classDefinitionMap, classEnrollments, courseMap, validCertificates]);

  const portfolio: PortfolioRecord[] = [];

  const isLoading =
    overviewQuery.isLoading ||
    certificatesQuery.isLoading ||
    difficultyLevelsQuery.isLoading ||
    classDefinitionQueries.some(query => query.isLoading) ||
    courseQueries.some(query => query.isLoading) ||
    categoryQueries.some(query => query.isLoading);

  return {
    studentName: profile?.full_name ?? student?.full_name ?? 'Student',
    skills,
    competencies,
    overviewMetrics,
    topSkills,
    levelBreakdown,
    categoryCounts,
    credentials,
    externalCertificates,
    experiences,
    achievements,
    verificationEvents,
    portfolio,
    isLoading,
    certificates: validCertificates,
    classEnrollments,
    courseEnrollments,
    courseMap,
    categoryMap,
  };
}

export type { SkillsWalletData };
