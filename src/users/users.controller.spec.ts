import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { User } from './user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let fakeUsersService: Partial<UsersService>;
  let fakeAuthService: Partial<AuthService>;

  beforeEach(async () => {
    fakeUsersService = {
      findOne: (id: number) => {
        return Promise.resolve({
          id,
          email: 'test@test.com',
          password: 'test',
        });
      },
      find: (email: string) => {
        return Promise.resolve([{ id: 1, email, password: 'test' } as User]);
      },
    };
    fakeAuthService = {
      signin: (email: string, password: string) => {
        return Promise.resolve({ id: 1, email, password } as User);
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
        {
          provide: AuthService,
          useValue: fakeAuthService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  it('find all users returns a list of users with the given email', async () => {
    const users = await controller.findAllUsers('test@test.com');
    expect(users.length).toEqual(1);
    expect(users[0].email).toEqual('test@test.com');
  });
  it('find one user by id return single user', async () => {
    const user = await controller.findUser('1');
    expect(user).toBeDefined();
  });
  it('find one user by id throw error if not found', async () => {
    fakeUsersService.findOne = () => null;
    await expect(controller.findUser('1')).rejects.toThrowError(
      NotFoundException,
    );
  });
  it('siging updates session object and returns user', async () => {
    const session = { userId: -10 };
    const user = await controller.signin(
      { email: 'asdf@as.com', password: 'asfasf' },
      session,
    );
    expect(user.id).toEqual(1);
    expect(session.userId).toEqual(1);
  });
});
