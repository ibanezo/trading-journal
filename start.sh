#!/bin/bash
cd "$(dirname "$0")"

# Kill anything on 8000 and 5173
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

echo "Starting backend..."
cd backend
python3 -m uvicorn app:app --port 8000 &
BACKEND_PID=$!
cd ..

echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
