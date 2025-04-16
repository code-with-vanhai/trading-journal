'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PeriodSelector({ onPeriodChange, defaultPeriod = 'all' }) {
  const [period, setPeriod] = useState(defaultPeriod);

  const handlePeriodChange = (value) => {
    setPeriod(value);
    onPeriodChange(value);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Period:</span>
      
      <div className="flex space-x-1">
        <Button 
          variant={period === 'week' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handlePeriodChange('week')}
        >
          Week
        </Button>
        
        <Button 
          variant={period === 'month' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handlePeriodChange('month')}
        >
          Month
        </Button>
        
        <Button 
          variant={period === 'year' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handlePeriodChange('year')}
        >
          Year
        </Button>
        
        <Button 
          variant={period === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handlePeriodChange('all')}
        >
          All
        </Button>
      </div>
      
      <Select 
        value={period}
        onValueChange={handlePeriodChange}
        className="w-[130px]"
      >
        <SelectTrigger>
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">Week</SelectItem>
          <SelectItem value="month">Month</SelectItem>
          <SelectItem value="year">Year</SelectItem>
          <SelectItem value="all">All Time</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
} 