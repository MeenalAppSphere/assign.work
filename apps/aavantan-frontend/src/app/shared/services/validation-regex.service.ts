// @ts-ignore
export class ValidationRegexService {

  public getValidatorErrorMessage(code: string) {
    const config = {
      'required': 'Required',
      'invalidLink': 'Is invalid link',
      'invalidEmailAddress': 'Invalid email address',
      'invalidPhone': 'Invalid phone'
    };
    return config[code];
  }

  public emailValidator(value: string) {
    // RFC 2822 compliant regex
    // tslint:disable-next-line
    if (value.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
      return { 'invalidEmailAddress': false, 'message': null };
    } else {
      return { 'invalidEmailAddress': true, 'message': this.getValidatorErrorMessage('invalidEmailAddress') };
    }
  }

  public phoneValidator(value: string) {
    // tslint:disable-next-line // for now format accepting 10 digit only
    if (value.match(/[0-9]{10}/)) {
      return { 'invalidPhone': false, 'message': null };
    } else {
      return { 'invalidPhone': true, 'message': this.getValidatorErrorMessage('invalidPhone') };
    }
  }
  public linkValidator(value: string) {
    // tslint:disable-next-line
    if (value.match(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/)) {
      return { 'invalidLink': false, 'message': null };
    } else {
      return { 'invalidLink': true, 'message': this.getValidatorErrorMessage('invalidLink') };
    }
  }

}
