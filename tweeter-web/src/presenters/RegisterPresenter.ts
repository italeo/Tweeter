import { Buffer } from "buffer";
import { AuthenticatePresenter, AuthView } from "./AuthenticatePresenter";

export class RegisterPresenter extends AuthenticatePresenter {
  public constructor(view: AuthView) {
    super(view);
  }

  public async doRegister(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    imageBytes: Uint8Array,
    imageFileExtension: string
  ) {
    this.setLoadingState(true);

    try {
      const [user, authToken] = await this.userService.register(
        firstName,
        lastName,
        alias,
        password,
        imageBytes,
        imageFileExtension
      );

      this.authenticated(user, authToken);
    } catch (error) {
      this.displayErrorMessage(
        `Failed to register user because of exception: ${error}`
      );
    } finally {
      this.setLoadingState(false);
    }
  }

  public handleImageFile(
    file: File | undefined,
    setImageUrl: (url: string) => void,
    setImageBytes: (bytes: Uint8Array) => void,
    setImageFileExtension: (ext: string) => void
  ) {
    if (file) {
      setImageUrl(URL.createObjectURL(file));

      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const imageStringBase64 = event.target?.result as string;
        const imageStringBase64BufferContents =
          imageStringBase64.split("base64,")[1];

        const bytes: Uint8Array = Buffer.from(
          imageStringBase64BufferContents,
          "base64"
        );

        setImageBytes(bytes);
      };
      reader.readAsDataURL(file);

      const fileExtension = this.getFileExtension(file);
      if (fileExtension) {
        setImageFileExtension(fileExtension);
      }
    } else {
      setImageUrl("");
      setImageBytes(new Uint8Array());
    }
  }

  // Helper function for extracting the file extension
  private getFileExtension(file: File): string | undefined {
    return file.name.split(".").pop();
  }
}
