import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // Create a fake copy of the users service
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = { id: Math.floor(Math.random() * 9999), email, password };
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: fakeUsersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instace of auth serivce', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with salted and hashed password', async () => {
    const user = await service.signup('test@asas.com', 'test');

    expect(user.password).not.toEqual('test');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('some@email.com', 'some');
    await expect(service.signup('some@email.com', 'some')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws if signin is called with an unused email', async () => {
    try {
      await service.signin('asdflkj@asdlfkj.com', 'passdflkj');
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundException);
      expect(err.message).toBe('User not found');
    }
  });
  it('throrws if an invlidad password provided', async () => {
    await service.signup('dadsa', 'some');
    await expect(service.signin('dadsa', 'some1')).rejects.toThrow(
      BadRequestException,
    );
  });
  it('it returns user if correct password is provided', async () => {
    await service.signup('dadsa@dasdas.com', 'some');
    const user = await service.signin('dadsa@dasdas.com', 'some');
    expect(user).toBeDefined();
  });
});
