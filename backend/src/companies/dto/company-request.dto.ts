import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  IsIn,
  IsObject,
} from "class-validator";

const JOIN_POLICIES = ["open", "approval", "invite_only"] as const;
const ROADMAP_TYPES = ["platform", "custom"] as const;
const ROADMAP_VISIBILITIES = ["public", "employees_only"] as const;
const COURSE_VISIBILITIES = ["public", "employees_only"] as const;
const JOB_TYPES = ["full_time", "part_time", "contract", "internship"] as const;

export class CreateCompanyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ enum: JOIN_POLICIES })
  @IsOptional()
  @IsIn(JOIN_POLICIES)
  joinPolicy?: (typeof JOIN_POLICIES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ enum: JOIN_POLICIES })
  @IsOptional()
  @IsIn(JOIN_POLICIES)
  joinPolicy?: (typeof JOIN_POLICIES)[number];
}

export class CreateCompanyRoadmapDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ROADMAP_TYPES })
  @IsOptional()
  @IsIn(ROADMAP_TYPES)
  type?: (typeof ROADMAP_TYPES)[number];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  challengeIds?: string[];

  @ApiPropertyOptional({ enum: ROADMAP_VISIBILITIES })
  @IsOptional()
  @IsIn(ROADMAP_VISIBILITIES)
  visibility?: (typeof ROADMAP_VISIBILITIES)[number];
}

export class AssignRoadmapDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class CreateCompanyCourseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  content?: any;

  @ApiPropertyOptional({ enum: COURSE_VISIBILITIES })
  @IsOptional()
  @IsIn(COURSE_VISIBILITIES)
  visibility?: (typeof COURSE_VISIBILITIES)[number];
}

export class CreateCompanyJobDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salaryRange?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: JOB_TYPES })
  @IsOptional()
  @IsIn(JOB_TYPES)
  type?: (typeof JOB_TYPES)[number];
}

export class CreateCompanyForumGroupDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(ROADMAP_VISIBILITIES)
  visibility?: (typeof ROADMAP_VISIBILITIES)[number];
}

export class CreateCompanyForumPostDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(ROADMAP_VISIBILITIES)
  visibility?: (typeof ROADMAP_VISIBILITIES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  isCompanyAnnouncement?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateRoadmapProgressDto {
  @ApiProperty()
  @IsNotEmpty()
  progress: number;
}

export class UpdateCourseProgressDto {
  @ApiProperty()
  @IsNotEmpty()
  progress: number;
}

export class UpdateCompanyJobDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salaryRange?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: JOB_TYPES })
  @IsOptional()
  @IsIn(JOB_TYPES)
  type?: (typeof JOB_TYPES)[number];

  @ApiPropertyOptional({ enum: ["active", "closed"] })
  @IsOptional()
  @IsIn(["active", "closed"])
  status?: "active" | "closed";
}
