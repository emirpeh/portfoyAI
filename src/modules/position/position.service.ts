/* eslint-disable prettier/prettier */
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { GetPositionsDto } from './dto/get-positions.dto';
import { CustomerService } from '../customer/customer.service';
import { Role } from '../auth/enums/role.enum';

@Injectable()
export class PositionService {
  constructor(
    private database: DatabaseService,
    @Inject(forwardRef(() => CustomerService))
    private customerService: CustomerService,
  ) {}

  async getPositions(input: GetPositionsDto, userId?: string, userRole?: Role) {
    const request = this.database.getPool().request();

    const { offset, limit, customer, search, sender, receiver, positionType } =
      input;

    request.input('offset', offset);
    request.input('limit', limit);

    let customerCompanyName = customer;
    if (userRole === Role.CUSTOMER && userId) {
      const customer = await this.customerService.findByUserId(userId);
      if (customer?.externalId) {
        customerCompanyName = customer.externalId;
        request.input('customerCompanyName', customerCompanyName);
      }
    }

    if (customer) {
      request.input('customer', `%${customer}%`);
    }

    if (sender) {
      request.input('sender', `%${sender}%`);
    }

    if (receiver) {
      request.input('receiver', `%${receiver}%`);
    }

    if (search) {
      request.input('customer', customer);
    }

    if (positionType) {
      request.input('positionType', positionType);
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM POZIHTABLE
      WHERE 1=1
      ${customer ? 'AND (PozFIr LIKE @customer OR PozGon LIKE @customer OR PozAlI LIKE @customer)' : ''} ${search ? 'AND PozFIr = @search' : ''} ${positionType ? 'AND IST = @positionType' : ''} ${sender && !customer ? 'AND PozGon LIKE @sender' : ''} ${receiver && !customer ? 'AND PozAlI LIKE @receiver' : ''} ${userRole === Role.CUSTOMER && customerCompanyName ? 'AND PozMus = @customerCompanyName' : ''}
    `;

    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;

    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY POZNO DESC) AS id,
        POZNO AS positionNo,
        CASE 
            WHEN IST = 'G' THEN 'G' 
            WHEN IST = 'D' THEN 'D'
            WHEN IST = 'T' THEN 'T'
            ELSE 'U' 
        END AS positionType,
        SIpTar AS orderDate,
        PozFIr AS customer,
        PozGon AS sender,
        PozAlI AS receiver,
        Pozulk1 AS countryOfLoading,
        Pozulk3 AS placeOfLoading,
        Pozulk2 AS countryOfUnloading,
        Pozulk4 AS placeOfUnloading,
        BosTar AS dateOfUnloading,
        Pozplk AS truckUnit,
        Pozgum AS customs
      FROM POZIHTABLE
      WHERE 1=1
      ${customer ? 'AND (PozFIr LIKE @customer OR PozGon LIKE @customer OR PozAlI LIKE @customer)' : ''} ${positionType ? 'AND IST = @positionType' : ''} ${sender && !customer ? 'AND PozGon LIKE @sender' : ''} ${receiver && !customer ? 'AND PozAlI LIKE @receiver' : ''} ${userRole === Role.CUSTOMER && customerCompanyName ? 'AND PozMus = @customerCompanyName' : ''}
      ORDER BY POZNO DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    const result = await request.query(query);

    return {
      data: result.recordset,
      total,
    };
  }

  async getPositionByPositionNo(
    positionNo: string,
    userId?: string,
    userRole?: Role,
  ) {
    const request = this.database.getPool().request();

    request.input('positionNo', `%${positionNo}%`);

    // Eğer kullanıcı CUSTOMER rolüne sahipse, müşteri bilgisini al
    let customerCompanyName;
    if (userRole === Role.CUSTOMER && userId) {
      const customer = await this.customerService.findByUserId(userId);
      if (customer?.externalId) {
        customerCompanyName = customer.externalId;
        request.input('customerCompanyName', customerCompanyName);
      }
    }

    const query = `
      SELECT 
        POZNO AS positionNo, 
        PozSIp AS partialNo, 
        YUKDURUM AS loadingStatus,
        PozPlk AS truckPlate,
        Pozcek AS trailerPlate,
        PozTam AS definition,
        PozGum AS customs,
        GUM2 AS entranceGate,
        GUM3 AS exitGate,
        PozAlI AS receiver,
        PozGon AS sender,
        Pozulk1 AS countryOfLoading,
        Pozulk2 AS countryOfUnloading,
        Pozulk3 AS placeOfLoading,
        Pozulk4 AS placeOfUnloading,
        IST AS positionType,
        FORMAT(SIpTar, 'yyyy-MM-dd') AS reservationNo, 
        PozFIr AS customer, 
        KAYAD AS salesRep, 
        KAYTAR AS openingDate,
        PozdovAD AS freightCurrencyType,
        PozFat AS freightInvoice,
        Pozdoo AS freightInvoiceAmount,
        Poznav AS freightInvoiceTLAmount
      FROM POZIHTable 
      WHERE POZNO LIKE @positionNo
      ${userRole === Role.CUSTOMER && customerCompanyName ? 'AND PozMus = @customerCompanyName' : ''}
    `;

    const result = await request.query(query);

    return result.recordset[0];
  }

  async getCargoDetailsByPositionNo(
    positionNo: string,
    userId?: string,
    userRole?: Role,
  ) {
    const request = this.database.getPool().request();

    request.input('positionNo', positionNo);

    // Eğer kullanıcı CUSTOMER rolüne sahipse, müşteri bilgisini al ve pozisyonun bu müşteriye ait olup olmadığını kontrol et
    if (userRole === Role.CUSTOMER && userId) {
      const customer = await this.customerService.findByUserId(userId);
      if (customer?.externalId) {
        const checkQuery = `
          SELECT COUNT(*) as count
          FROM POZIHTABLE
          WHERE POZNO = @positionNo AND PozMus = @customerCompanyName
        `;
        request.input('customerCompanyName', customer.externalId);
        const checkResult = await request.query(checkQuery);
        if (checkResult.recordset[0].count === 0) {
          return [];
        }
      }
    }

    const query = `
      SELECT 
        kod AS code,
        MALCINS AS goodsType,
        marka AS brand,
        KILO AS weight,
        ACINS AS materialType,
        adet AS quantity,
        boy AS length,
        en AS width,
        yuk AS height,
        m3 AS volume,
        SIRANO AS serialNo
      FROM POZIHYUKSATIR 
      WHERE POZNO = @positionNo 
      ORDER BY serialNo;
    `;

    const result = await request.query(query);

    return result.recordset;
  }

  async getLoadingUnloadingInformationByPositionNo(
    positionNo: string,
    userId?: string,
    userRole?: Role,
  ) {
    const request = this.database.getPool().request();
    request.input('positionNo', positionNo);

    // Eğer kullanıcı CUSTOMER rolüne sahipse, müşteri bilgisini al ve pozisyonun bu müşteriye ait olup olmadığını kontrol et
    if (userRole === Role.CUSTOMER && userId) {
      const customer = await this.customerService.findByUserId(userId);
      if (customer?.externalId) {
        const checkQuery = `
          SELECT COUNT(*) as count
          FROM POZIHTABLE
          WHERE POZNO = @positionNo AND PozMus = @customerCompanyName
        `;
        request.input('customerCompanyName', customer.externalId);
        const checkResult = await request.query(checkQuery);
        if (checkResult.recordset[0].count === 0) {
          return { loadingPlace: [], unloadingPlace: [] };
        }
      }
    }

    try {
      const loadingQuery = `
            SELECT [ID], [YER] AS place, [ADRES] AS address, 
                   FORMAT([TARIH], 'yyyy-MM-dd') AS date, 
                   [MALCINS] AS goodsType, [ADET] AS quantity, 
                   [KILO] AS weight, [ACK] AS notes 
            FROM [POZYUKBOS] 
            WHERE TIP = '0' AND [POZNO] LIKE @positionNo 
            ORDER BY SIRANO;
        `;

      const unloadingQuery = `
            SELECT [ID], [YER] AS place, [ADRES] AS address, 
                   FORMAT([TARIH], 'yyyy-MM-dd') AS date, 
                   [MALCINS] AS goodsType, [ADET] AS quantity, 
                   [KILO] AS weight, [ACK] AS notes 
            FROM [POZYUKBOS] 
            WHERE TIP = '1' AND [POZNO] LIKE @positionNo 
            ORDER BY SIRANO;
        `;

      const [loadingResult, unloadingResult] = await Promise.all([
        request.query(loadingQuery),
        request.query(unloadingQuery),
      ]);

      return {
        loadingPlace: loadingResult.recordset.map(row => ({
          place: row.place,
          address: row.address,
          date: row.date,
          goodsType: row.goodsType,
          weight: row.weight,
          quantity: row.quantity,
          notes: row.notes,
        })),
        unloadingPlace: unloadingResult.recordset.map(row => ({
          place: row.place,
          address: row.address,
          date: row.date,
          goodsType: row.goodsType,
          weight: row.weight,
          quantity: row.quantity,
          notes: row.notes,
        })),
      };
    } catch (error) {
      console.error('Error fetching loading/unloading information:', error);
      throw new Error('Failed to retrieve data');
    }
  }

  async getPositionPartialLoads(
    positionNo: string,
    userId?: string,
    userRole?: Role,
  ) {
    const request = this.database.getPool().request();
    request.input('positionNo', positionNo);

    // Eğer kullanıcı CUSTOMER rolüne sahipse, müşteri bilgisini al ve pozisyonun bu müşteriye ait olup olmadığını kontrol et
    if (userRole === Role.CUSTOMER && userId) {
      const customer = await this.customerService.findByUserId(userId);
      if (customer?.externalId) {
        const checkQuery = `
          SELECT COUNT(*) as count
          FROM POZIHTABLE
          WHERE POZNO = @positionNo AND PozMus = @customerCompanyName
        `;
        request.input('customerCompanyName', customer.externalId);
        const checkResult = await request.query(checkQuery);
        if (checkResult.recordset[0].count === 0) {
          return []; // Bu pozisyon bu müşteriye ait değilse boş dizi döndür
        }
      }
    }

    const query = `
        SELECT 
            LTRIM(RTRIM(POZNO)) AS 'positionNo',
            LTRIM(RTRIM(POZFIR)) AS 'customer',
            RTRIM(LTRIM(POZGON)) AS 'sender',
            RTRIM(LTRIM(POZALI)) AS 'receiver',
            RTRIM(LTRIM(N1A)) AS 'consignee',
            POZTOP AS 'packages',
            POZTKG AS 'weight',
            POZTM3 AS 'volume',
            (SELECT TOP 1 
                REPLACE(RTRIM(RTRIM(POZCIN1) + ' ' + 
                              RTRIM(POZCIN2) + ' ' + 
                              RTRIM(POZCIN3) + ' ' + 
                              RTRIM(POZCIN4) + ' ' + 
                              RTRIM(POZCIN5) + ' ' + 
                              RTRIM(POZCIN6) + ' ' + 
                              RTRIM(POZCIN7) + ' ' + 
                              RTRIM(POZCIN8) + ' ' + 
                              RTRIM(POZCIN9) + ' ' + 
                              RTRIM(POZCIN10) + ' ' + 
                              RTRIM(POZCIN11) + ' ' + 
                              RTRIM(POZCIN12) + ' ' + 
                              RTRIM(POZCIN13) + ' ' + 
                              RTRIM(POZCIN14) + ' ' + 
                              RTRIM(POZCIN15) + ' ' + 
                              RTRIM(POZCIN16) + ' ' + 
                              RTRIM(POZCIN17) + ' ' + 
                              RTRIM(POZCIN18) + ' ' + 
                              RTRIM(POZCIN19) + ' ' + 
                              RTRIM(POZCIN20)), '  ', ' ') 
            FROM POZHITABLE 
            WHERE POZHITABLE.CPOZNO = POZIHTABLE.POZNO) 
            AS 'goodsType',
            POZDOO AS 'freight',
            TTARIH AS 'loadingDate',
            BOSTAR AS 'unloadingDate',
            POZGUM AS 'customsName',
            NO1 AS 'warehouse'
        FROM POZIHTABLE 
        WHERE POZNO = @positionNo;
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  async getDashboardStats(
    startDate?: string,
    endDate?: string,
    userId?: string,
    userRole?: Role,
  ) {
    const request = this.database.getPool().request();

    if (!request) {
      throw new Error('Failed to initialize database request');
    }

    if (startDate) {
      request.input('startDate', startDate);
    }
    if (endDate) {
      request.input('endDate', endDate);
    }

    let customerCompanyName;
    if (userRole === Role.CUSTOMER && userId) {
      const customer = await this.customerService.findByUserId(userId);
      if (customer?.externalId) {
        customerCompanyName = customer.externalId;
        request.input('customerCompanyName', customerCompanyName);
      }
    }

    const query = `
      SELECT 
        COUNT(CASE WHEN IST = 'G' THEN 1 END) as gCount,
        COUNT(CASE WHEN IST = 'D' THEN 1 END) as dCount,
        COUNT(CASE WHEN IST = 'T' THEN 1 END) as tCount,
        COUNT(*) as totalCount,
        FORMAT(SIpTar, 'yyyy-MM-dd') as date
      FROM POZIHTABLE
      WHERE 1=1
      ${startDate ? 'AND SIpTar >= @startDate' : ''}
      ${endDate ? 'AND SIpTar <= @endDate' : ''}
      ${userRole === Role.CUSTOMER && customerCompanyName ? 'AND PozMus = @customerCompanyName' : ''}
      GROUP BY FORMAT(SIpTar, 'yyyy-MM-dd')
      ORDER BY date DESC
    `;

    const result = await request.query(query);

    return {
      summary: {
        gTotal: result.recordset.reduce(
          (sum, row) => sum + (row.gCount || 0),
          0,
        ),
        dTotal: result.recordset.reduce(
          (sum, row) => sum + (row.dCount || 0),
          0,
        ),
        tTotal: result.recordset.reduce(
          (sum, row) => sum + (row.tCount || 0),
          0,
        ),
        grandTotal: result.recordset.reduce(
          (sum, row) => sum + (row.totalCount || 0),
          0,
        ),
      },
    };
  }

  async getMonthlyStats(customer?: string, userId?: string, userRole?: Role) {
    const request = this.database.getPool().request();

    let customerCompanyName = customer;
    if (userRole === Role.CUSTOMER && userId) {
      const customer = await this.customerService.findByUserId(userId);
      if (customer?.externalId) {
        customerCompanyName = customer.externalId;
      }
    }

    if (customerCompanyName) {
      request.input('customer', customerCompanyName);
    }

    const query = `
      WITH LastTwelveMonths AS (
        SELECT 
          DATEFROMPARTS(YEAR(DATEADD(MONTH, number, DATEADD(MONTH, -11, GETDATE()))), 
                        MONTH(DATEADD(MONTH, number, DATEADD(MONTH, -11, GETDATE()))), 
                        1) as MonthStart
        FROM master.dbo.spt_values 
        WHERE type = 'P' AND number <= 11
      )
      SELECT 
        FORMAT(m.MonthStart, 'yyyy-MM') as monthYear,
        COUNT(CASE WHEN p.IST = 'G' THEN 1 END) as gCount,
        COUNT(CASE WHEN p.IST = 'D' THEN 1 END) as dCount,
        COUNT(CASE WHEN p.IST = 'T' THEN 1 END) as tCount,
        COUNT(p.POZNO) as totalCount
      FROM LastTwelveMonths m
      LEFT JOIN POZIHTABLE p ON FORMAT(p.SIpTar, 'yyyy-MM') = FORMAT(m.MonthStart, 'yyyy-MM')
      WHERE 1=1 ${customerCompanyName ? 'AND p.PozMus = @customer' : ''}
      GROUP BY m.MonthStart
      ORDER BY m.MonthStart DESC;
    `;

    const result = await request.query(query);

    return {
      monthlyData: result.recordset.map(row => ({
        monthYear: row.monthYear,
        gCount: row.gCount || 0,
        dCount: row.dCount || 0,
        tCount: row.tCount || 0,
        totalCount: row.totalCount || 0,
      })),
      summary: {
        gTotal: result.recordset.reduce(
          (sum, row) => sum + (row.gCount || 0),
          0,
        ),
        dTotal: result.recordset.reduce(
          (sum, row) => sum + (row.dCount || 0),
          0,
        ),
        tTotal: result.recordset.reduce(
          (sum, row) => sum + (row.tCount || 0),
          0,
        ),
        grandTotal: result.recordset.reduce(
          (sum, row) => sum + (row.totalCount || 0),
          0,
        ),
      },
    };
  }

  async getPositionFiles(
    positionNo?: string,
    startDate?: Date,
    endDate?: Date,
    isSendMail?: boolean,
  ) {
    const request = this.database.getPool().request();
    let query = `
      SELECT DISTINCT
        Evrak_Bilgi.ID as id,
        Evrak_Bilgi.PozNo as pozNo,
        RTRIM(Evrak_Bilgi.DosyaAdi) as DosyaAdi,
        Evrak_Bilgi.tarih,
        MUSTTABLE_Yetkili.Firma_No as companyNo,
        RTRIM(Evrak_Bilgi.aciklama) as aciklama,
        RTRIM(Evrak_Bilgi.firmaadi) as firma,
        RTRIM(Evrak_Bilgi.yol) as yol,
        PozFIr AS customer,
        PozGon AS sender,
        PozAlI AS receiver,
        Evrak_Bilgi.Tip,
        Evrak_Bilgi.belge,
        Evrak_Bilgi.ftpyol,
        RTRIM(MUSTTABLE_Yetkili.Email) as email
      FROM [NAK01-2021].[dbo].[Evrak_Bilgi]
      INNER JOIN POZIHTABLE ON POZIHTABLE.POZNO = Evrak_Bilgi.PozNo
      INNER JOIN MUSTTABLE_Yetkili ON MUSTTABLE_Yetkili.Firma_No = POZIHTABLE.PozMus
      WHERE 1=1
      AND MUSTTABLE_Yetkili.Email IS NOT NULL
      AND MUSTTABLE_Yetkili.Email != ''
    `;

    if (positionNo) {
      request.input('positionNo', positionNo);
      query += ` AND Evrak_Bilgi.PozNo LIKE '%' + @positionNo + '%'`;
    }

    if (isSendMail) {
      query += ` AND Evrak_Bilgi.Tip != '1'`;
    }

    if (startDate) {
      request.input('startDate', startDate);
      query += ` AND Evrak_Bilgi.tarih >= @startDate`;
    }

    if (endDate) {
      request.input('endDate', endDate);
      query += ` AND Evrak_Bilgi.tarih <= @endDate`;
    }

    query += ` ORDER BY Evrak_Bilgi.tarih DESC`;

    const result = await request.query(query);

    const fileMap = new Map<
      string,
      {
        file: any;
        emails: Set<string>;
      }
    >();

    for (const row of result.recordset) {
      const fileKey = `${row.ID}_${row.DosyaAdi}_${row.pozNo}`;

      if (!fileMap.has(fileKey)) {
        // Yeni dosya
        const { email, ...fileData } = row;
        fileMap.set(fileKey, {
          file: fileData,
          emails: new Set([email]),
        });
      } else {
        // Var olan dosyaya email ekle
        fileMap.get(fileKey)!.emails.add(row.email);
      }
    }

    // Map'i uygun formata dönüştür
    const groupedFiles = Array.from(fileMap.values()).map(
      ({ file, emails }) => ({
        ...file,
        emails: Array.from(emails),
      }),
    );

    return groupedFiles;
  }

  async getPositionFilesByPositionNo(positionNo: string) {
    const request = this.database.getPool().request();
    request.input('positionNo', positionNo);

    const query = `
      SELECT DISTINCT
        Evrak_Bilgi.ID as id,
        RTRIM(Evrak_Bilgi.DosyaAdi) as fileName,
        Evrak_Bilgi.tarih as date
      FROM [NAK01-2021].[dbo].[Evrak_Bilgi]
      WHERE Evrak_Bilgi.PozNo = @positionNo
    `;

    const result = await request.query(query);

    return result.recordset;
  }

  async getPositionFilesById(id: string) {
    const request = this.database.getPool().request();
    request.input('id', id);

    const query = `
      SELECT DISTINCT
        Evrak_Bilgi.ID as id,
        Evrak_Bilgi.Yol as path,
        Evrak_Bilgi.DosyaAdi as fileName,
        Evrak_Bilgi.PozNo as positionId
      FROM [NAK01-2021].[dbo].[Evrak_Bilgi]
      WHERE Evrak_Bilgi.ID = @id
    `;

    const result = await request.query(query);

    return result.recordset;
  }

  async getTruckDetailByPositionNo(positionNo: string) {
    const request = this.database.getPool().request();
    request.input('positionNo', positionNo);

    const query = `
      select aracdurum as lastLocation from arac_takibi WHERE pozno=@positionNo ORDER BY ID
    `;

    const result = await request.query(query);

    return result.recordset;
  }
}
