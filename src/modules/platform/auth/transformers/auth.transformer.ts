import { LoginResponseDto } from '../dto/login-response.dto';

export class AuthTransformer {
  static toLoginResponseDto(data: LoginResponseDto): LoginResponseDto {
    const responseDto = new LoginResponseDto();
    responseDto.accessToken = data.accessToken;
    responseDto.tokenType = data.tokenType;
    responseDto.expiresIn = data.expiresIn;
    responseDto.user = {
      id: data.user.id,
      email: data.user.email,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
    };
    return responseDto;
  }
}
