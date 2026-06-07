import type { PropsWithChildren } from 'react';

const ClientLayout = ({ children }: PropsWithChildren) => {
  return <div className="mx-auto w-11/12 lg:max-w-7xl">{children}</div>;
};
export default ClientLayout;
