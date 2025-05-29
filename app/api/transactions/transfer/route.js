import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionIds, targetAccountId } = await request.json();

    // Validate input
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json({ error: 'Danh sách giao dịch không hợp lệ' }, { status: 400 });
    }

    if (!targetAccountId) {
      return NextResponse.json({ error: 'Tài khoản đích là bắt buộc' }, { status: 400 });
    }

    // Verify target account exists and belongs to user
    const targetAccount = await prisma.stockAccount.findFirst({
      where: {
        id: targetAccountId,
        userId: session.user.id
      }
    });

    if (!targetAccount) {
      return NextResponse.json({ error: 'Tài khoản đích không tồn tại' }, { status: 404 });
    }

    // Verify all transactions exist and belong to user
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: session.user.id
      },
      include: {
        StockAccount: true
      }
    });

    if (transactions.length !== transactionIds.length) {
      return NextResponse.json({ error: 'Một số giao dịch không tồn tại hoặc không có quyền truy cập' }, { status: 404 });
    }

    // Check if any transaction is already in the target account
    const alreadyInTarget = transactions.filter(t => t.stockAccountId === targetAccountId);
    if (alreadyInTarget.length > 0) {
      return NextResponse.json({ 
        error: `Một số giao dịch đã thuộc tài khoản đích` 
      }, { status: 400 });
    }

    // Perform the transfer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update all transactions to new account
      const updatedTransactions = await tx.transaction.updateMany({
        where: {
          id: { in: transactionIds },
          userId: session.user.id
        },
        data: {
          stockAccountId: targetAccountId,
          updatedAt: new Date()
        }
      });

      return updatedTransactions;
    });

    return NextResponse.json({
      message: `Đã chuyển ${result.count} giao dịch sang tài khoản ${targetAccount.name}`,
      transferredCount: result.count
    });

  } catch (error) {
    console.error('Transfer transactions error:', error);
    return NextResponse.json(
      { error: 'Lỗi server khi chuyển giao dịch' },
      { status: 500 }
    );
  }
}

// Transfer stocks (multiple tickers from portfolio)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tickers, fromAccountId, targetAccountId } = await request.json();

    // Validate input
    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ error: 'Danh sách mã cổ phiếu không hợp lệ' }, { status: 400 });
    }

    if (!targetAccountId) {
      return NextResponse.json({ error: 'Tài khoản đích là bắt buộc' }, { status: 400 });
    }

    // Verify target account exists and belongs to user
    const targetAccount = await prisma.stockAccount.findFirst({
      where: {
        id: targetAccountId,
        userId: session.user.id
      }
    });

    if (!targetAccount) {
      return NextResponse.json({ error: 'Tài khoản đích không tồn tại' }, { status: 404 });
    }

    // Build where clause for finding transactions
    const whereClause = {
      userId: session.user.id,
      ticker: { in: tickers }
    };

    // If fromAccountId is specified, filter by it, otherwise find from all accounts except target
    if (fromAccountId) {
      whereClause.stockAccountId = fromAccountId;
    } else {
      whereClause.stockAccountId = { not: targetAccountId };
    }

    // Find all transactions for the specified tickers
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        StockAccount: true
      }
    });

    if (transactions.length === 0) {
      return NextResponse.json({ 
        error: 'Không tìm thấy giao dịch nào cho các mã cổ phiếu được chọn' 
      }, { status: 404 });
    }

    // Group by source account for reporting
    const sourceAccounts = [...new Set(transactions.map(t => t.StockAccount?.name || 'Tài khoản không xác định'))];

    // Perform the transfer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const transactionIds = transactions.map(t => t.id);
      
      // Update all transactions to new account
      const updatedTransactions = await tx.transaction.updateMany({
        where: {
          id: { in: transactionIds }
        },
        data: {
          stockAccountId: targetAccountId,
          updatedAt: new Date()
        }
      });

      return updatedTransactions;
    });

    return NextResponse.json({
      message: `Đã chuyển ${result.count} giao dịch của ${tickers.length} mã cổ phiếu từ ${sourceAccounts.join(', ')} sang tài khoản ${targetAccount.name}`,
      transferredCount: result.count,
      tickersCount: tickers.length,
      fromAccounts: sourceAccounts,
      toAccount: targetAccount.name
    });

  } catch (error) {
    console.error('Transfer stocks error:', error);
    return NextResponse.json(
      { error: 'Lỗi server khi chuyển cổ phiếu' },
      { status: 500 }
    );
  }
} 