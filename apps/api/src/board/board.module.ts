import { Module } from '@nestjs/common';
import { BoardController } from './board.controller';

@Module({
  controllers: [BoardController],
  providers: []
})
export class BoardModule {
}
