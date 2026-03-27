import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  HttpStatusCode,
  Method,
} from 'axios';

const defaults = {
  headers: (): AxiosRequestConfig['headers'] => ({
    'Content-Type': 'application/json',
  }),
  error: {
    code: 'INTERNAL_SERVER_ERROR',
    message:
      'Something went wrong. Please check your internet connection or contact our support.',
    status: HttpStatusCode.ServiceUnavailable,
    data: {},
  },
};

const createMethod =
  (method: Method) =>
  async <T = any, V = Record<string, any>>(
    url: string,
    variables?: V,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const isGet = method === 'GET';
    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url,
        headers: defaults.headers(),
        params: isGet ? variables : undefined,
        data: !isGet ? variables : undefined,
        ...config,
      });
      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        return Promise.reject(err.response.data);
      }
      return Promise.reject(defaults.error);
    }
  };

const api = {
  get: createMethod('GET'),
  post: createMethod('POST'),
  put: createMethod('PUT'),
  patch: createMethod('PATCH'),
  delete: createMethod('DELETE'),
};

export default api;
