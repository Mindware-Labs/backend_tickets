import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,              // <--- Importante
  ParseIntPipe,       // <--- Importante para evitar el crash
  DefaultValuePipe,   // <--- Importante para valores por defecto
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger'; // Opcional, para documentación

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createWithInvite(createUserDto);
  }

  // 👇 AQUÍ ESTÁ EL ARREGLO
  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    // Ahora le pasamos los números limpios al servicio
    return this.usersService.findAll(page, limit);
  }
  // 👆 FIN DEL ARREGLO

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Patch(':id/block')
  block(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.usersService.blockUser(+id, isActive);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}