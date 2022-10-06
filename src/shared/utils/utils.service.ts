import { Injectable } from '@nestjs/common';
import * as moment from 'moment-timezone';
import { Task, TaskList } from '../../interfaces/task.interface';

@Injectable()
export class UtilsService {
  constructor() {
    // TODO IF NEED
  }

  /**
   * MOMENT DATE FUNCTIONS
   * getDateString()
   * getNextDateString()
   * getLocalDateTime()
   * getDateWithCurrentTime()
   * getDateMonth()
   */
  getDateString(date: Date): string {
    return moment(date).format('YYYY-MM-DD');
  }

  getNextDateString(date: Date, day): string {
    return moment(date).add(day, 'days').format('YYYY-MM-DD');
  }

  getLocalDateTime(): Date {
    const newDate = moment().tz('Asia/Dhaka');
    return newDate.toDate();
  }

  getDateWithCurrentTime(date: Date): Date {
    const _ = moment().tz('Asia/Dhaka');
    // const newDate = moment(date).add({hours: _.hour(), minutes:_.minute() , seconds:_.second()});
    const newDate = moment(date).add({ hours: _.hour(), minutes: _.minute() });
    return newDate.toDate();
  }

  getDateMonth(fromZero: boolean, date?: any): number {
    let d;
    if (date) {
      d = new Date(date);
    } else {
      d = new Date();
    }
    const month = d.getMonth();
    return fromZero ? month : month + 1;
  }

  /**
   * STRING FUNCTIONS
   * transformToSlug
   */
  public transformToSlug(value: string, salt?: boolean): string {
    const slug = value
      .trim()
      .replace(/[^A-Z0-9]+/gi, '-')
      .toLowerCase();

    return salt ? `${slug}-${this.getRandomInt(1, 100)}` : slug;
  }

  /**
   * RANDOM FUNCTIONS
   */
  getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * PAD LEADING
   */
  padLeadingZeros(num): string {
    return String(num).padStart(4, '0');
  }

  /**
   * GET DATA
   * getTotalTime()
   */
  getTotalTime(list: TaskList[], field: string): number {
    if (list) {
      return list
        .map((t) => {
          return t[field] ? (t[field] as number) : 0;
        })
        .reduce((acc, value) => acc + value, 0);
    } else {
      return 0;
    }
  }

  getTotalKpiTime(tasks: Task[], field: string): number {
    if (tasks) {
      return tasks
        .map((t) => {
          return t[field] ? (t[field] as number) : 0;
        })
        .reduce((acc, value) => acc + value, 0);
    } else {
      return 0;
    }
  }
}
