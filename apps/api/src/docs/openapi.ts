export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'AI Poster Maker API',
    version: '0.1.0',
    description: 'Backend API for generating AI-assisted political posters.',
  },
  servers: [{ url: '/', description: 'Same-origin (via web app proxy) or direct API host' }],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'pm_token' },
    },
    parameters: {
      Page: { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
      Limit: { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, default: 20 } },
    },
    schemas: {
      ApiErrorBody: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string' },
              details: {},
            },
          },
        },
      },
      PublicUser: {
        type: 'object',
        required: ['id', 'name', 'email', 'role'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['user', 'admin'] },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 60 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 72 },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      Palette: {
        type: 'object',
        required: ['id', 'name', 'primary', 'secondary', 'accent', 'text', 'footerBg'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          primary: { type: 'string', example: '#1a1a1a' },
          secondary: { type: 'string', example: '#1a1a1a' },
          accent: { type: 'string', example: '#1a1a1a' },
          text: { type: 'string', example: '#1a1a1a' },
          footerBg: { type: 'string', example: '#1a1a1a' },
        },
      },
      TemplateDTO: {
        type: 'object',
        required: ['id', 'slug', 'title', 'occasion', 'layoutKey', 'photoSlots', 'thumbnailUrl', 'defaultHeadline', 'palettes'],
        properties: {
          id: { type: 'string' },
          slug: { type: 'string' },
          title: { type: 'string' },
          occasion: { type: 'string', enum: ['victory_day', 'mourning', 'election', 'greetings', 'festival'] },
          layoutKey: { type: 'string', enum: ['victory', 'tribute', 'campaign'] },
          photoSlots: { type: 'integer' },
          thumbnailUrl: { type: 'string' },
          defaultHeadline: { type: 'string' },
          palettes: { type: 'array', items: { $ref: '#/components/schemas/Palette' } },
        },
      },
      AdminTemplateDTO: {
        allOf: [
          { $ref: '#/components/schemas/TemplateDTO' },
          {
            type: 'object',
            required: ['motifs', 'defaultDesign', 'isActive'],
            properties: {
              motifs: { type: 'array', items: { type: 'string', enum: ['paddy_field', 'flag_waves', 'doves', 'sunrise', 'floral', 'boat_river'] } },
              defaultDesign: { $ref: '#/components/schemas/PosterDesign' },
              isActive: { type: 'boolean' },
            },
          },
        ],
      },
      AdminTemplateCreateInput: {
        type: 'object',
        required: ['slug', 'title', 'occasion', 'layoutKey', 'photoSlots', 'thumbnailUrl', 'defaultHeadline', 'palettes', 'motifs', 'defaultDesign'],
        properties: {
          slug: { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', minLength: 2, maxLength: 60 },
          title: { type: 'string', minLength: 2, maxLength: 80 },
          occasion: { type: 'string', enum: ['victory_day', 'mourning', 'election', 'greetings', 'festival'] },
          layoutKey: { type: 'string', enum: ['victory', 'tribute', 'campaign'] },
          photoSlots: { type: 'integer', minimum: 1, maximum: 3 },
          thumbnailUrl: { type: 'string', maxLength: 2000 },
          defaultHeadline: { type: 'string', minLength: 1, maxLength: 80 },
          palettes: { type: 'array', minItems: 1, items: { $ref: '#/components/schemas/Palette' } },
          motifs: { type: 'array', minItems: 1, items: { type: 'string', enum: ['paddy_field', 'flag_waves', 'doves', 'sunrise', 'floral', 'boat_river'] } },
          defaultDesign: { $ref: '#/components/schemas/PosterDesign' },
        },
      },
      AdminTemplateUpdateInput: {
        allOf: [{ $ref: '#/components/schemas/AdminTemplateCreateInput' }],
        description: 'All fields optional (partial update).',
      },
      PosterFormData: {
        type: 'object',
        required: ['name', 'designation', 'organization', 'union', 'thana', 'district', 'headline', 'tagline'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 60 },
          designation: { type: 'string', minLength: 2, maxLength: 80 },
          organization: { type: 'string', minLength: 2, maxLength: 100 },
          union: { type: 'string', maxLength: 60 },
          thana: { type: 'string', maxLength: 60 },
          district: { type: 'string', minLength: 2, maxLength: 40 },
          headline: { type: 'string', minLength: 2, maxLength: 100 },
          tagline: { type: 'string', maxLength: 80 },
          topLine: { type: 'string', maxLength: 60, description: 'Ballot layouts: small strip at the top, e.g. বিসমিল্লাহির রাহমানির রাহিম' },
          electionDate: { type: 'string', maxLength: 60, description: 'Ballot layouts: election date line' },
          symbol: { type: 'string', maxLength: 30, description: 'Ballot layouts: ballot symbol name, rendered as "<symbol> মার্কায়"' },
          appeal: { type: 'string', maxLength: 140, description: 'Ballot layouts: vote appeal; a default is used when empty' },
          campaignBy: { type: 'string', maxLength: 80, description: 'Ballot layouts: "প্রচারে" credit; derived from the area when empty' },
        },
      },
      FocusPoint: {
        type: 'object',
        required: ['x', 'y'],
        properties: { x: { type: 'number', minimum: 0, maximum: 1 }, y: { type: 'number', minimum: 0, maximum: 1 } },
      },
      PosterDesign: {
        type: 'object',
        required: ['paletteId', 'motif', 'headlineFont', 'headlineScale', 'photoFocus'],
        properties: {
          paletteId: { type: 'string', minLength: 1, maxLength: 40 },
          motif: { type: 'string', enum: ['paddy_field', 'flag_waves', 'doves', 'sunrise', 'floral', 'boat_river'] },
          headlineFont: { type: 'string', enum: ['noto-serif-bengali', 'hind-siliguri', 'noto-sans-bengali'] },
          headlineScale: { type: 'number', minimum: 0.8, maximum: 1.3 },
          photoFocus: { type: 'array', items: { $ref: '#/components/schemas/FocusPoint' } },
          tagline: { type: 'string', maxLength: 80 },
        },
      },
      CreatePosterInput: {
        type: 'object',
        required: ['templateId', 'formData', 'photoIds'],
        properties: {
          templateId: { type: 'string' },
          formData: { $ref: '#/components/schemas/PosterFormData' },
          photoIds: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1, maxLength: 200 } },
        },
      },
      RegenerateInput: {
        type: 'object',
        properties: {
          formData: { description: 'Partial PosterFormData; omitted fields keep their current value.', allOf: [{ $ref: '#/components/schemas/PosterFormData' }] },
        },
      },
      PosterDTO: {
        type: 'object',
        required: ['id', 'templateId', 'formData', 'status', 'imageUrl', 'downloadUrls', 'regenerationsLeft', 'error', 'createdAt'],
        properties: {
          id: { type: 'string' },
          templateId: { type: 'string' },
          formData: { $ref: '#/components/schemas/PosterFormData' },
          status: { type: 'string', enum: ['pending_review', 'queued', 'generating', 'completed', 'failed', 'rejected'] },
          imageUrl: { type: 'string', nullable: true },
          downloadUrls: {
            nullable: true,
            type: 'object',
            properties: { png: { type: 'string' }, jpg: { type: 'string' } },
          },
          regenerationsLeft: { type: 'integer' },
          error: { type: 'string', nullable: true },
          rejectionNote: { type: 'string', nullable: true, description: "Admin's note when status is rejected" },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      PosterListDTO: {
        type: 'object',
        required: ['items', 'total', 'page', 'limit'],
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/PosterDTO' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
      },
      AdminPosterDTO: {
        allOf: [
          { $ref: '#/components/schemas/PosterDTO' },
          { type: 'object', required: ['ownerName', 'ownerEmail'], properties: { ownerName: { type: 'string' }, ownerEmail: { type: 'string' } } },
        ],
      },
      AdminPosterListDTO: {
        type: 'object',
        required: ['items', 'total', 'page', 'limit'],
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/AdminPosterDTO' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
      },
      ModerationItemDTO: {
        allOf: [
          { $ref: '#/components/schemas/AdminPosterDTO' },
          {
            type: 'object',
            required: ['flagReason', 'flaggedAt', 'photoUrls'],
            properties: {
              flagReason: { type: 'string' },
              flaggedAt: { type: 'string', format: 'date-time' },
              photoUrls: { type: 'array', items: { type: 'string' } },
            },
          },
        ],
      },
      ModerationListDTO: {
        type: 'object',
        required: ['items', 'total', 'page', 'limit'],
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/ModerationItemDTO' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
      },
      UploadedPhotoDTO: {
        type: 'object',
        required: ['publicId', 'url', 'width', 'height'],
        properties: {
          publicId: { type: 'string' },
          url: { type: 'string' },
          width: { type: 'integer' },
          height: { type: 'integer' },
        },
      },
    },
    responses: {
      ValidationError: {
        description: 'Invalid request body',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorBody' } } },
      },
      Unauthorized: {
        description: 'Missing, invalid, or expired session',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorBody' } } },
      },
      Forbidden: {
        description: 'Authenticated but not permitted to access this resource',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorBody' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorBody' } } },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['System'],
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } } } },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Register a new account',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } },
        },
        responses: {
          '201': {
            description: 'Registered — sets the pm_token session cookie',
            content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/PublicUser' } } } } },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '409': { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorBody' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Log in',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
        },
        responses: {
          '200': {
            description: 'Logged in — sets the pm_token session cookie',
            content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/PublicUser' } } } } },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { description: 'Invalid email or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorBody' } } } },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        summary: 'Log out',
        tags: ['Auth'],
        responses: { '204': { description: 'Session cookie cleared' } },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Get the current authenticated user',
        tags: ['Auth'],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Current user',
            content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/PublicUser' } } } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/user/me': {
      get: {
        summary: 'Get the current authenticated user (legacy user-module stub)',
        description: 'Placeholder endpoint; returns a fixed message rather than the user record. Prefer /api/auth/me.',
        tags: ['User'],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'ok bro' } } } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/templates': {
      get: {
        summary: 'List active templates',
        tags: ['Templates'],
        parameters: [
          { name: 'occasion', in: 'query', schema: { type: 'string', enum: ['victory_day', 'mourning', 'election', 'greetings', 'festival'] } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/TemplateDTO' } } } } } },
          },
        },
      },
    },
    '/api/templates/{id}': {
      get: {
        summary: 'Get a single active template',
        tags: ['Templates'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/TemplateDTO' } } } },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/upload': {
      post: {
        summary: 'Upload a photo for use in a poster',
        tags: ['Uploads'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { type: 'object', required: ['photo'], properties: { photo: { type: 'string', format: 'binary' } } },
            },
          },
        },
        responses: {
          '201': { description: 'Uploaded', content: { 'application/json': { schema: { $ref: '#/components/schemas/UploadedPhotoDTO' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/posters': {
      post: {
        summary: 'Create (queue) a new poster generation',
        tags: ['Posters'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePosterInput' } } },
        },
        responses: {
          '202': { description: 'Accepted — poster queued for generation', content: { 'application/json': { schema: { $ref: '#/components/schemas/PosterDTO' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { description: 'Generation rate limit exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorBody' } } } },
        },
      },
    },
    '/api/posters/me': {
      get: {
        summary: "List the current user's posters",
        tags: ['Posters'],
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/Page' }, { $ref: '#/components/parameters/Limit' }],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PosterListDTO' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/posters/user/{userId}': {
      get: {
        summary: "List a specific user's posters",
        description: 'Callable by the owning user or an admin.',
        tags: ['Posters'],
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
        ],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PosterListDTO' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/posters/{id}': {
      get: {
        summary: 'Get a poster by id',
        tags: ['Posters'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PosterDTO' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Delete a poster',
        tags: ['Posters'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Deleted' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/posters/{id}/regenerate': {
      post: {
        summary: 'Regenerate a poster (atomic, consumes a regeneration credit)',
        tags: ['Posters'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: false,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegenerateInput' } } },
        },
        responses: {
          '202': { description: 'Accepted — poster re-queued for generation', content: { 'application/json': { schema: { $ref: '#/components/schemas/PosterDTO' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { description: 'Generation rate limit exceeded or no regenerations left', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorBody' } } } },
        },
      },
    },
    '/api/files/{publicId}': {
      get: {
        summary: 'Serve a stored image (memory-storage mode only)',
        description: 'Only mounted when STORAGE_MODE is not "cloudinary". Cloudinary-backed images are served directly from Cloudinary URLs instead.',
        tags: ['Files'],
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'publicId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['png', 'jpg'] } },
          { name: 'download', in: 'query', schema: { type: 'string', enum: ['1'] } },
          { name: 'width', in: 'query', schema: { type: 'integer', minimum: 16, maximum: 2400 } },
          { name: 'v', in: 'query', schema: { type: 'integer', minimum: 0 } },
        ],
        responses: {
          '200': { description: 'Image bytes', content: { 'image/png': { schema: { type: 'string', format: 'binary' } }, 'image/jpeg': { schema: { type: 'string', format: 'binary' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/admin/templates': {
      get: {
        summary: 'List all templates (including inactive)',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/AdminTemplateDTO' } } } } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        summary: 'Create a template',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminTemplateCreateInput' } } },
        },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminTemplateDTO' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/admin/templates/{id}': {
      patch: {
        summary: 'Update a template',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminTemplateUpdateInput' } } },
        },
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminTemplateDTO' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Deactivate a template',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Deactivated' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/admin/posters': {
      get: {
        summary: 'List posters across all users',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending_review', 'queued', 'generating', 'completed', 'failed', 'rejected'] } },
        ],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminPosterListDTO' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/admin/moderation': {
      get: {
        summary: 'Moderation queue: posters flagged for review (status pending_review), oldest first',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/Page' }, { $ref: '#/components/parameters/Limit' }],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ModerationListDTO' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/admin/moderation/{id}/approve': {
      post: {
        summary: 'Approve a flagged poster and send it to generation',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Approved — poster queued', content: { 'application/json': { schema: { $ref: '#/components/schemas/PosterDTO' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { description: 'POSTER_NOT_PENDING — already decided' },
        },
      },
    },
    '/api/admin/moderation/{id}/reject': {
      post: {
        summary: 'Reject a flagged poster; it will never be generated',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { note: { type: 'string', maxLength: 300, description: 'Shown to the user' } } } } },
        },
        responses: {
          '200': { description: 'Rejected', content: { 'application/json': { schema: { $ref: '#/components/schemas/PosterDTO' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { description: 'POSTER_NOT_PENDING — already decided' },
        },
      },
    },
    '/api/admin/users': {
      get: {
        summary: 'List users',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
          { name: 'blocked', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/PublicUser' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/admin/users/{id}/block': {
      patch: {
        summary: 'Block a user',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Blocked' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/admin/users/{id}/unblock': {
      patch: {
        summary: 'Unblock a user',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Unblocked' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
} as const;
