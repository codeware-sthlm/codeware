import { z } from 'zod';

export const EmailValidation = {
  standardEmail: z.string().email(),
  githubBotEmail: z
    .string()
    .regex(
      /^\d+\+[\w-]+\[bot\]@users\.noreply\.github\.com$/,
      'Invalid GitHub bot email'
    ),
  anyBotEmail: z.string().refine(
    (email) => {
      const githubBotPattern =
        /^\d+\+[\w-]+\[bot\]@users\.noreply\.github\.com$/;
      const regularEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return githubBotPattern.test(email) || regularEmailPattern.test(email);
    },
    {
      message: 'Invalid email address'
    }
  )
};

export const ActionInputsSchema = z.object({
  author: z.string(),
  autoMerge: z.boolean(),
  checkToken: z.boolean(),
  committer: z.string(),
  dryRun: z.boolean(),
  mainBranch: z.string(),
  packagePatterns: z.array(z.string()),
  prAssignees: z.string(),
  skipTests: z.boolean(),
  skipE2E: z.boolean(),
  token: z.string().min(1, 'token is required')
});

export const MigrateConfigSchema = z.object({
  author: z
    .object({
      name: z.string(),
      email: EmailValidation.anyBotEmail
    })
    .optional(),
  autoMerge: z.boolean(),
  committer: z.object({
    name: z.string().min(1, 'committer name is required'),
    email: EmailValidation.anyBotEmail
  }),
  dryRun: z.boolean(),
  mainBranch: z.string().min(1, 'main branch is required'),
  packagePatterns: z
    .array(z.string().min(1))
    .min(1, 'at least one package pattern is required'),
  prAssignees: z.array(z.string().min(1)),
  skipTests: z.boolean(),
  skipE2E: z.boolean(),
  token: z.string().min(1, 'token is required')
});
