import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class SelectWorldDto {
  @IsString()
  worldSource: string;

  @IsString()
  @IsOptional()
  @IsIn(['local', 'global'])
  worldScope?: 'local' | 'global';

  @IsString()
  worldLevelName: string;

  @IsBoolean()
  @IsOptional()
  forceWorldCopy?: boolean;

  @IsBoolean()
  @IsOptional()
  restartIfRunning?: boolean;
}
