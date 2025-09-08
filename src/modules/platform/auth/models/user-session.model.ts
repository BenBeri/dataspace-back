import { User } from '../../entities/user/user.entity';

export class UserSession {
  user: User;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;

  constructor(user?: User) {
    if (user) {
      this.user = user;
      this.userId = user.id;
      this.email = user.email;
      this.firstName = user.firstName;
      this.lastName = user.lastName;
      this.isActive = user.isActive;
    }
  }

  static create(user: User): UserSession {
    if (!user) {
      throw new Error('User object is required to create UserSession');
    }
    
    if (!user.id) {
      throw new Error('User must have a valid ID to create UserSession');
    }

    return new UserSession(user);
  }
}
