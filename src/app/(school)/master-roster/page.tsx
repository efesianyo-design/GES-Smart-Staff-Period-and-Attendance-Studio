import React, { useState } from 'react';
import { MasterRosterMode } from '../../../components/MasterRosterMode';
import { storageEngine } from '../../../utils/storage';
import { StaffMember, Classroom } from '../../../types';

export default function MasterRosterPage() {
  const [staffList, setStaffList] = useState(() => storageEngine.getStaff());
  const [gateRecords] = useState(() => storageEngine.getGateAttendance());
  const [periodSessions] = useState(() => storageEngine.getPeriodSessions());
  const [classrooms, setClassrooms] = useState(() => storageEngine.getClassrooms());

  const handleAddStaff = (member: StaffMember) => {
    storageEngine.addStaffMember(member);
    setStaffList(storageEngine.getStaff());
  };

  const handleBulkAddStaff = (members: StaffMember[]) => {
    storageEngine.saveStaff([...members, ...storageEngine.getStaff()]);
    setStaffList(storageEngine.getStaff());
  };

  const handleBulkAddClassrooms = (newClassrooms: Classroom[]) => {
    storageEngine.saveClassrooms([...newClassrooms, ...storageEngine.getClassrooms()]);
    setClassrooms(storageEngine.getClassrooms());
  };

  return (
    <div className="w-full">
      <MasterRosterMode
        staffList={staffList}
        gateRecords={gateRecords}
        periodSessions={periodSessions}
        classrooms={classrooms}
        onAddStaff={handleAddStaff}
        onBulkAddStaff={handleBulkAddStaff}
        onBulkAddClassrooms={handleBulkAddClassrooms}
      />
    </div>
  );
}
