import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Tickets API is running!';  // Cambia esto por un mensaje más descriptivo
  }
}