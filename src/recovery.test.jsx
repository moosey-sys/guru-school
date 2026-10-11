import React from 'react';
import {it,expect,vi} from 'vitest';
import {render,screen} from '@testing-library/react';
import {AppBoundary} from './components/AppBoundary';
it('unexpected render failures provide accessible recovery without exposing the error',()=>{
 const logger=vi.spyOn(console,'error').mockImplementation(()=>{});
 function Broken(){throw Error('private visitor information');}
 render(<AppBoundary><Broken/></AppBoundary>);
 expect(screen.getByRole('alert')).toHaveTextContent('Please reload this page.');expect(screen.getByRole('button',{name:'Reload page'})).toBeInTheDocument();expect(screen.queryByText('private visitor information')).not.toBeInTheDocument();logger.mockRestore();
});
