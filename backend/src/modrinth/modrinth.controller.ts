import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { ModrinthService } from './modrinth.service';
import { SearchModrinthModsQueryDto } from './dto/search-mods.query.dto';
import { SearchModrinthModpacksQueryDto } from './dto/search-modpacks.query.dto';

@Controller('modrinth')
@UseGuards(JwtAuthGuard)
export class ModrinthController {
  constructor(private readonly modrinthService: ModrinthService) {}

  @Get('mods/search')
  async searchMods(@Query() query: SearchModrinthModsQueryDto) {
    return this.modrinthService.searchMods({
      q: query.q,
      limit: query.limit,
      offset: query.offset,
      minecraftVersion: query.minecraftVersion,
      loader: query.loader,
    });
  }

  @Get('search')
  async searchModpacks(@Query() query: SearchModrinthModpacksQueryDto) {
    return this.modrinthService.searchModpacks({
      q: query.q,
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Get('featured')
  async getFeaturedModpacks(@Query('limit') limit?: string) {
    return this.modrinthService.getFeaturedModpacks(limit ? Number.parseInt(limit, 10) : 10);
  }

  @Get('popular')
  async getPopularModpacks(@Query('limit') limit?: string) {
    return this.modrinthService.getPopularModpacks(limit ? Number.parseInt(limit, 10) : 10);
  }

  @Get(':id')
  async getModpack(@Param('id') id: string) {
    return this.modrinthService.getModpack(id);
  }

  @Get(':id/version')
  async getModpackVersions(@Param('id') id: string) {
    return this.modrinthService.getModpackVersions(id);
  }
}
