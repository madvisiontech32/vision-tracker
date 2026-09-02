import "server-only";
import { connectDB } from "./mongodb";
import { Developer, Milestone, Project, Task } from "./models";

export type Id = string;

export type PublicProject = {
  _id: Id;
  name: string;
  client: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  milestoneCount: number;
  taskCount: number;
  doneCount: number;
  progress: number;
};

const pct = (done: number, total: number) =>
  total === 0 ? 0 : Math.round((done / total) * 100);

/** Projects shown on the public home page, with rolled-up progress. */
export async function getPublicProjects(): Promise<PublicProject[]> {
  await connectDB();

  const projects = await Project.find({ visible: true })
    .sort({ createdAt: -1 })
    .lean();

  const ids = projects.map((p) => p._id);

  const [milestoneCounts, taskStats] = await Promise.all([
    Milestone.aggregate([
      { $match: { project: { $in: ids } } },
      { $group: { _id: "$project", total: { $sum: 1 } } },
    ]),
    Task.aggregate([
      { $match: { project: { $in: ids } } },
      {
        $group: {
          _id: "$project",
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const mMap = new Map(milestoneCounts.map((m) => [String(m._id), m.total]));
  const tMap = new Map(
    taskStats.map((t) => [String(t._id), { total: t.total, done: t.done }])
  );

  return projects.map((p) => {
    const key = String(p._id);
    const t = tMap.get(key) ?? { total: 0, done: 0 };
    return {
      _id: key,
      name: p.name,
      client: p.client ?? "",
      description: p.description ?? "",
      status: p.status,
      startDate: p.startDate ? new Date(p.startDate).toISOString() : null,
      endDate: p.endDate ? new Date(p.endDate).toISOString() : null,
      milestoneCount: mMap.get(key) ?? 0,
      taskCount: t.total,
      doneCount: t.done,
      progress: pct(t.done, t.total),
    };
  });
}

/** One project, without the password hash. Returns null when hidden/missing. */
export async function getProject(id: Id, opts: { publicOnly?: boolean } = {}) {
  await connectDB();
  const project = await Project.findById(id).lean();
  if (!project) return null;
  if (opts.publicOnly && !project.visible) return null;
  return {
    ...project,
    _id: String(project._id),
    startDate: project.startDate ? new Date(project.startDate).toISOString() : null,
    endDate: project.endDate ? new Date(project.endDate).toISOString() : null,
  };
}

export type MilestoneWithStats = {
  _id: Id;
  title: string;
  description: string;
  status: string;
  dueDate: string | null;
  order: number;
  developers: { _id: Id; name: string; role: string; color: string }[];
  taskCount: number;
  doneCount: number;
  progress: number;
};

/** All milestones of a project with developer chips and task progress. */
export async function getMilestones(projectId: Id): Promise<MilestoneWithStats[]> {
  await connectDB();

  const milestones = await Milestone.find({ project: projectId })
    .populate({ path: "developers", model: Developer, select: "name role color" })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  const stats = await Task.aggregate([
    { $match: { milestone: { $in: milestones.map((m) => m._id) } } },
    {
      $group: {
        _id: "$milestone",
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
      },
    },
  ]);
  const sMap = new Map(
    stats.map((s) => [String(s._id), { total: s.total, done: s.done }])
  );

  return milestones.map((m) => {
    const s = sMap.get(String(m._id)) ?? { total: 0, done: 0 };
    return {
      _id: String(m._id),
      title: m.title,
      description: m.description ?? "",
      status: m.status,
      dueDate: m.dueDate ? new Date(m.dueDate).toISOString() : null,
      order: m.order ?? 0,
      developers: (m.developers ?? []).map((d: Record<string, unknown>) => ({
        _id: String(d._id),
        name: String(d.name ?? ""),
        role: String(d.role ?? ""),
        color: String(d.color ?? "#6b6b6b"),
      })),
      taskCount: s.total,
      doneCount: s.done,
      progress: pct(s.done, s.total),
    };
  });
}

export type MilestoneDeveloper = {
  _id: Id;
  name: string;
  role: string;
  color: string;
  skills: string[];
  taskCount: number;
  doneCount: number;
  progress: number;
};

export type MilestoneDetail = {
  _id: Id;
  title: string;
  description: string;
  status: string;
  dueDate: string | null;
  developers: MilestoneDeveloper[];
};

/** A milestone plus its developers, each with their own task counts. */
export async function getMilestoneDetail(
  projectId: Id,
  milestoneId: Id
): Promise<MilestoneDetail | null> {
  await connectDB();

  const milestone = await Milestone.findOne({
    _id: milestoneId,
    project: projectId,
  })
    .populate({ path: "developers", model: Developer, select: "name role color skills" })
    .lean();
  if (!milestone) return null;

  const stats = await Task.aggregate([
    { $match: { milestone: milestone._id } },
    {
      $group: {
        _id: "$developer",
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
      },
    },
  ]);
  const sMap = new Map(
    stats.map((s) => [String(s._id), { total: s.total, done: s.done }])
  );

  const developers: MilestoneDeveloper[] = (milestone.developers ?? []).map(
    (d: Record<string, unknown>) => {
      const s = sMap.get(String(d._id)) ?? { total: 0, done: 0 };
      return {
        _id: String(d._id),
        name: String(d.name ?? ""),
        role: String(d.role ?? ""),
        color: String(d.color ?? "#6b6b6b"),
        skills: (d.skills as string[]) ?? [],
        taskCount: s.total,
        doneCount: s.done,
        progress: pct(s.done, s.total),
      };
    }
  );

  return {
    _id: String(milestone._id),
    title: milestone.title,
    description: milestone.description ?? "",
    status: milestone.status,
    dueDate: milestone.dueDate ? new Date(milestone.dueDate).toISOString() : null,
    developers,
  };
}

/** Tasks one developer owns inside one milestone. */
export async function getDeveloperTasks(milestoneId: Id, developerId: Id) {
  await connectDB();

  const developer = await Developer.findById(developerId).lean();
  if (!developer) return null;

  const tasks = await Task.find({ milestone: milestoneId, developer: developerId })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return {
    developer: {
      _id: String(developer._id),
      name: developer.name,
      role: developer.role ?? "",
      color: developer.color ?? "#6b6b6b",
      email: developer.email ?? "",
      skills: developer.skills ?? [],
    },
    tasks: tasks.map((t) => ({
      _id: String(t._id),
      title: t.title,
      description: t.description ?? "",
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
    })),
  };
}

/** Counters for the admin dashboard. */
export async function getAdminStats() {
  await connectDB();
  const [projects, milestones, developers, tasks, doneTasks] = await Promise.all([
    Project.countDocuments(),
    Milestone.countDocuments(),
    Developer.countDocuments(),
    Task.countDocuments(),
    Task.countDocuments({ status: "done" }),
  ]);
  return { projects, milestones, developers, tasks, doneTasks };
}

export async function getDevelopers() {
  await connectDB();
  const developers = await Developer.find()
    .select("+passwordHash")
    .sort({ name: 1 })
    .lean();
  return developers.map((d) => ({
    _id: String(d._id),
    name: d.name,
    email: d.email ?? "",
    role: d.role ?? "",
    color: d.color ?? "#6b6b6b",
    skills: d.skills ?? [],
    active: d.active ?? true,
    // Never leak the hash itself - the admin list only needs to know whether
    // this developer can sign in.
    canLogin: Boolean(d.email && d.passwordHash),
    lastLoginAt: d.lastLoginAt ? new Date(d.lastLoginAt).toISOString() : null,
  }));
}

/** Every task in a milestone, grouped by the developer that owns it. */
export async function getTasksByDeveloper(milestoneId: Id) {
  await connectDB();
  const tasks = await Task.find({ milestone: milestoneId })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  const grouped: Record<
    string,
    {
      _id: Id;
      title: string;
      description: string;
      status: string;
      priority: string;
      dueDate: string | null;
    }[]
  > = {};

  for (const t of tasks) {
    const key = String(t.developer);
    (grouped[key] ??= []).push({
      _id: String(t._id),
      title: t.title,
      description: t.description ?? "",
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
    });
  }

  return grouped;
}

export type TreeTask = {
  _id: Id;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
};

export type TreeDeveloper = {
  _id: Id;
  name: string;
  role: string;
  color: string;
  email: string;
  skills: string[];
  taskCount: number;
  doneCount: number;
  progress: number;
  tasks: TreeTask[];
};

export type TreeMilestone = {
  _id: Id;
  title: string;
  description: string;
  status: string;
  dueDate: string | null;
  taskCount: number;
  doneCount: number;
  progress: number;
  developers: TreeDeveloper[];
};

export type ProjectTree = {
  project: {
    _id: Id;
    name: string;
    client: string;
    description: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    taskCount: number;
    doneCount: number;
    progress: number;
  };
  milestones: TreeMilestone[];
};

/**
 * The whole project in one shot: milestones -> developers -> tasks.
 * Used by the client explorer, which renders everything without navigating.
 */
export async function getProjectTree(projectId: Id): Promise<ProjectTree | null> {
  await connectDB();

  const project = await Project.findById(projectId).lean();
  if (!project || !project.visible) return null;

  const [milestones, tasks] = await Promise.all([
    Milestone.find({ project: projectId })
      .populate({
        path: "developers",
        model: Developer,
        select: "name role color email skills",
      })
      .sort({ order: 1, createdAt: 1 })
      .lean(),
    Task.find({ project: projectId }).sort({ order: 1, createdAt: 1 }).lean(),
  ]);

  // milestoneId -> developerId -> tasks
  const byMilestone = new Map<string, Map<string, TreeTask[]>>();
  for (const t of tasks) {
    const mKey = String(t.milestone);
    const dKey = String(t.developer);
    if (!byMilestone.has(mKey)) byMilestone.set(mKey, new Map());
    const devMap = byMilestone.get(mKey)!;
    if (!devMap.has(dKey)) devMap.set(dKey, []);
    devMap.get(dKey)!.push({
      _id: String(t._id),
      title: t.title,
      description: t.description ?? "",
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
    });
  }

  let projectTotal = 0;
  let projectDone = 0;

  const tree: TreeMilestone[] = milestones.map((m) => {
    const devMap = byMilestone.get(String(m._id)) ?? new Map<string, TreeTask[]>();

    let mTotal = 0;
    let mDone = 0;

    const developers: TreeDeveloper[] = (m.developers ?? []).map(
      (d: Record<string, unknown>) => {
        const devTasks = devMap.get(String(d._id)) ?? [];
        const done = devTasks.filter((t) => t.status === "done").length;
        mTotal += devTasks.length;
        mDone += done;

        return {
          _id: String(d._id),
          name: String(d.name ?? ""),
          role: String(d.role ?? ""),
          color: String(d.color ?? "#6b6b6b"),
          email: String(d.email ?? ""),
          skills: (d.skills as string[]) ?? [],
          taskCount: devTasks.length,
          doneCount: done,
          progress: pct(done, devTasks.length),
          tasks: devTasks,
        };
      }
    );

    projectTotal += mTotal;
    projectDone += mDone;

    return {
      _id: String(m._id),
      title: m.title,
      description: m.description ?? "",
      status: m.status,
      dueDate: m.dueDate ? new Date(m.dueDate).toISOString() : null,
      taskCount: mTotal,
      doneCount: mDone,
      progress: pct(mDone, mTotal),
      developers,
    };
  });

  return {
    project: {
      _id: String(project._id),
      name: project.name,
      client: project.client ?? "",
      description: project.description ?? "",
      status: project.status,
      startDate: project.startDate
        ? new Date(project.startDate).toISOString()
        : null,
      endDate: project.endDate ? new Date(project.endDate).toISOString() : null,
      taskCount: projectTotal,
      doneCount: projectDone,
      progress: pct(projectDone, projectTotal),
    },
    milestones: tree,
  };
}

export type DeveloperTask = {
  _id: Id;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectName: string;
  milestoneTitle: string;
  milestoneDue: string | null;
};

export type DeveloperWorkload = {
  tasks: DeveloperTask[];
  counts: Record<string, number>;
  total: number;
  progress: number;
};

/** Every task assigned to one developer, across all projects. */
export async function getDeveloperWorkload(
  developerId: Id
): Promise<DeveloperWorkload> {
  await connectDB();

  const tasks = await Task.find({ developer: developerId })
    .populate({ path: "project", model: Project, select: "name" })
    .populate({ path: "milestone", model: Milestone, select: "title dueDate" })
    .sort({ dueDate: 1, order: 1, createdAt: 1 })
    .lean();

  const counts: Record<string, number> = {
    todo: 0,
    "in-progress": 0,
    review: 0,
    done: 0,
  };

  const mapped: DeveloperTask[] = tasks.map((t) => {
    counts[t.status] = (counts[t.status] ?? 0) + 1;
    const project = t.project as unknown as { name?: string } | null;
    const milestone = t.milestone as unknown as {
      title?: string;
      dueDate?: Date | null;
    } | null;

    return {
      _id: String(t._id),
      title: t.title,
      description: t.description ?? "",
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
      projectName: project?.name ?? "Removed project",
      milestoneTitle: milestone?.title ?? "Removed milestone",
      milestoneDue: milestone?.dueDate
        ? new Date(milestone.dueDate).toISOString()
        : null,
    };
  });

  return {
    tasks: mapped,
    counts,
    total: mapped.length,
    progress: pct(counts.done ?? 0, mapped.length),
  };
}
